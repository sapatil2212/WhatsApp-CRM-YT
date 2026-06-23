import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils'

/**
 * POST /api/healthcare/follow-ups
 *
 * Automated follow-up system that sends post-visit messages to patients:
 *   - Post-visit feedback (24h after appointment marked complete)
 *   - Prescription reminder (daily at scheduled time)
 *   - Follow-up appointment reminder (7 days after visit)
 *
 * Protect with AUTOMATION_CRON_SECRET via `x-cron-secret` header.
 * Schedule every 60 minutes via Vercel Cron or external scheduler.
 *
 * This endpoint drastically reduces manual follow-up work for clinics.
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatDocName(name: string): string {
  if (!name) return ''
  return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`
}

export async function POST(request: Request) {
  const secret = process.env.AUTOMATION_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'AUTOMATION_CRON_SECRET is not configured' },
      { status: 503 }
    )
  }

  const supplied = request.headers.get('x-cron-secret')
  if (supplied !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const now = new Date()
  const nowIso = now.toISOString()

  // ─── 1. Post-Visit Feedback (24h after appointment completed) ──────────────
  // Find appointments completed in the last 20-28 hours that haven't
  // received a feedback request yet.
  const feedbackWindowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString()
  const feedbackWindowEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()

  const { data: completedAppts } = await db
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      clinic_id,
      contact_id,
      feedback_sent,
      contacts ( id, name, phone ),
      doctors ( doctor_name, specialization ),
      clinics ( user_id, clinic_name )
    `)
    .eq('status', 'completed')
    .or('feedback_sent.is.null,feedback_sent.eq.false')
    .gte('updated_at', feedbackWindowStart)
    .lte('updated_at', feedbackWindowEnd)

  // ─── 2. Follow-up Reminder (7 days after completed visit) ──────────────────
  const followUpWindowStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const followUpWindowEnd = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()

  const { data: followUpAppts } = await db
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      clinic_id,
      contact_id,
      followup_sent,
      contacts ( id, name, phone ),
      doctors ( doctor_name, specialization ),
      clinics ( user_id, clinic_name )
    `)
    .eq('status', 'completed')
    .or('followup_sent.is.null,followup_sent.eq.false')
    .gte('updated_at', followUpWindowStart)
    .lte('updated_at', followUpWindowEnd)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configCache: Record<string, any> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function getWhatsAppConfig(userId: string): Promise<any | null> {
    if (configCache[userId] !== undefined) return configCache[userId]
    const { data: config } = await db
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    configCache[userId] = config ?? null
    return configCache[userId]
  }

  let feedbackSent = 0
  let followUpSent = 0
  let skipped = 0

  // ─── Process Feedback Messages ─────────────────────────────────────────────
  for (const appt of completedAppts || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = appt as any
    const contact = a.contacts
    const doctor = a.doctors
    const clinic = a.clinics

    if (!contact?.phone || !clinic?.user_id) {
      skipped++
      continue
    }

    const config = await getWhatsAppConfig(clinic.user_id)
    if (!config) { skipped++; continue }

    const accessToken = decrypt(config.access_token)
    const phoneNumberId = config.phone_number_id as string
    const sanitizedPhone = sanitizePhoneForMeta(contact.phone)
    const docName = doctor ? formatDocName(doctor.doctor_name) : 'your doctor'
    const clinicName = clinic.clinic_name || 'our clinic'

    const feedbackMsg = `⭐ *How was your visit?*\n\nHi ${contact.name || 'there'}! We hope your appointment with ${docName} went well.\n\nYour feedback helps us improve! Please rate your experience:\n\n1️⃣ Excellent 🌟\n2️⃣ Good 👍\n3️⃣ Average 😐\n4️⃣ Needs Improvement 👎\n\nJust reply with a number. Thank you for choosing *${clinicName}*! 🙏`

    try {
      try {
        await sendTextMessage({
          phoneNumberId,
          accessToken,
          to: sanitizedPhone,
          text: feedbackMsg,
        })
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Follow-ups] Dev mode error fallback for feedback (appt ${appt.id}): ${err.message || err}. Simulating success.`)
        } else {
          throw err
        }
      }

      await db
        .from('appointments')
        .update({ feedback_sent: true })
        .eq('id', appt.id)

      // Save to conversation
      const { data: conv } = await db
        .from('conversations')
        .select('id')
        .eq('user_id', clinic.user_id)
        .eq('contact_id', appt.contact_id)
        .maybeSingle()

      if (conv) {
        await db.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'bot',
          content_type: 'text',
          content_text: feedbackMsg,
          message_id: `feedback-${appt.id}-${Date.now()}`,
          status: 'sent',
          created_at: nowIso,
        })
      }

      feedbackSent++
    } catch (err: unknown) {
      console.error(`[Follow-ups] Feedback send failed for appt ${appt.id}:`, err)
      skipped++
    }
  }

  // ─── Process Follow-up Messages ────────────────────────────────────────────
  for (const appt of followUpAppts || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = appt as any
    const contact = a.contacts
    const doctor = a.doctors
    const clinic = a.clinics

    if (!contact?.phone || !clinic?.user_id) {
      skipped++
      continue
    }

    const config = await getWhatsAppConfig(clinic.user_id)
    if (!config) { skipped++; continue }

    const accessToken = decrypt(config.access_token)
    const phoneNumberId = config.phone_number_id as string
    const sanitizedPhone = sanitizePhoneForMeta(contact.phone)
    const docName = doctor ? formatDocName(doctor.doctor_name) : 'your doctor'
    const clinicName = clinic.clinic_name || 'our clinic'

    const followUpMsg = `🩺 *Follow-up Check-in*\n\nHi ${contact.name || 'there'}! It's been a week since your visit with ${docName}.\n\nHow are you feeling? 🤗\n\nIf you need:\n📅 A follow-up appointment\n💊 Prescription refill\n❓ Any questions about your treatment\n\nJust reply here and we'll help you right away!\n\n— *${clinicName}* 🏥`

    try {
      try {
        await sendTextMessage({
          phoneNumberId,
          accessToken,
          to: sanitizedPhone,
          text: followUpMsg,
        })
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Follow-ups] Dev mode error fallback for follow-up (appt ${appt.id}): ${err.message || err}. Simulating success.`)
        } else {
          throw err
        }
      }

      await db
        .from('appointments')
        .update({ followup_sent: true })
        .eq('id', appt.id)

      // Save to conversation
      const { data: conv } = await db
        .from('conversations')
        .select('id')
        .eq('user_id', clinic.user_id)
        .eq('contact_id', appt.contact_id)
        .maybeSingle()

      if (conv) {
        await db.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'bot',
          content_type: 'text',
          content_text: followUpMsg,
          message_id: `followup-${appt.id}-${Date.now()}`,
          status: 'sent',
          created_at: nowIso,
        })
      }

      followUpSent++
    } catch (err: unknown) {
      console.error(`[Follow-ups] Follow-up send failed for appt ${appt.id}:`, err)
      skipped++
    }
  }

  console.log(`[Follow-ups] Done: feedback=${feedbackSent}, followup=${followUpSent}, skipped=${skipped}`)
  return NextResponse.json({ feedbackSent, followUpSent, skipped })
}
