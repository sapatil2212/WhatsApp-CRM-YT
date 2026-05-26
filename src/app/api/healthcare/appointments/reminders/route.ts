import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils'

/**
 * POST /api/healthcare/appointments/reminders
 *
 * Cron endpoint that sends WhatsApp appointment reminder messages to patients:
 *   - 24-hour reminder (fires when appointment is 20–25 h away)
 *   - 3-hour  reminder (fires when appointment is  2–4  h away)
 *
 * Protect with the shared `AUTOMATION_CRON_SECRET` via the
 * `x-cron-secret` request header (same secret used by the
 * automations cron).  Schedule this endpoint to run every 30–60
 * minutes via Vercel Cron, an external pinger, or any scheduler.
 *
 * Usage:
 *   curl -X POST https://yourapp.com/api/healthcare/appointments/reminders \
 *        -H "x-cron-secret: <AUTOMATION_CRON_SECRET>"
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

/**
 * Combine a DATE string (YYYY-MM-DD) and a TIME string (HH:MM) into
 * a JS Date object in the server's local timezone — consistent with
 * the rest of the codebase which uses local dates throughout.
 */
function appointmentToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
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

  // Fetch all scheduled appointments for today and the next 2 days
  // that still need at least one reminder sent.
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const in2DaysDate = new Date(now)
  in2DaysDate.setDate(in2DaysDate.getDate() + 2)
  const in2DaysStr = `${in2DaysDate.getFullYear()}-${String(in2DaysDate.getMonth() + 1).padStart(2, '0')}-${String(in2DaysDate.getDate()).padStart(2, '0')}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments, error: apptError } = await db
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      clinic_id,
      contact_id,
      reminder_24h_sent,
      reminder_3h_sent,
      contacts ( id, name, phone ),
      doctors ( doctor_name, specialization ),
      clinics ( user_id )
    `)
    .eq('status', 'scheduled')
    .gte('appointment_date', todayStr)
    .lte('appointment_date', in2DaysStr)
    .or('reminder_24h_sent.eq.false,reminder_3h_sent.eq.false')

  if (apptError) {
    console.error('[Reminders] Error fetching appointments:', apptError)
    return NextResponse.json({ error: apptError.message }, { status: 500 })
  }

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0 })
  }

  // Cache WhatsApp configs by user_id to avoid repeated DB calls
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

  let processed = 0
  let skipped = 0

  for (const appt of appointments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apptAny = appt as any
    const contact = apptAny.contacts
    const doctor  = apptAny.doctors
    const clinic  = apptAny.clinics

    if (!contact?.phone || !clinic?.user_id) {
      skipped++
      continue
    }

    const apptDateTime = appointmentToDate(appt.appointment_date, appt.appointment_time)
    const msUntilAppt = apptDateTime.getTime() - now.getTime()
    const hoursUntil  = msUntilAppt / (1000 * 60 * 60)

    // Decide which reminder (if any) is due right now.
    // Windows are intentionally wider than the cron interval to
    // tolerate slight timing jitter (cron every 30 min → ±15 min).
    const needs24h = !appt.reminder_24h_sent && hoursUntil >= 20 && hoursUntil <= 25
    const needs3h  = !appt.reminder_3h_sent  && hoursUntil >=  2 && hoursUntil <=  4

    if (!needs24h && !needs3h) {
      skipped++
      continue
    }

    // Skip if appointment is already in the past
    if (msUntilAppt <= 0) {
      skipped++
      continue
    }

    const config = await getWhatsAppConfig(clinic.user_id)
    if (!config) {
      console.warn(`[Reminders] No WhatsApp config for user ${clinic.user_id}`)
      skipped++
      continue
    }

    const accessToken   = decrypt(config.access_token)
    const phoneNumberId = config.phone_number_id as string

    const docName = doctor ? formatDocName(doctor.doctor_name) : 'your doctor'
    const specStr  = doctor?.specialization ? ` (${doctor.specialization})` : ''
    const formattedDate = apptDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    })
    const formattedTime = appt.appointment_time

    const sanitizedPhone = sanitizePhoneForMeta(contact.phone)

    // Process each due reminder
    for (const kind of (['24h', '3h'] as const)) {
      const isNeeded = kind === '24h' ? needs24h : needs3h
      if (!isNeeded) continue

      const reminderMsg =
        kind === '24h'
          ? `⏰ *Appointment Reminder — Tomorrow*\n\nHi ${contact.name || 'there'}! Just a friendly reminder that your appointment with ${docName}${specStr} is scheduled for *${formattedDate} at ${formattedTime}*.\n\nPlease arrive 5–10 minutes early. Reply here if you need to reschedule. See you soon! 🏥`
          : `🔔 *Appointment in ~3 Hours*\n\nHi ${contact.name || 'there'}! Your appointment with ${docName}${specStr} is in approximately 3 hours — today at *${formattedTime}*.\n\nSee you soon! 🏥`

      let sentMessageId = ''

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Reminders] DEV mode — simulating ${kind} reminder for appt ${appt.id}`)
        sentMessageId = `dev-reminder-${kind}-${Date.now()}`
      } else {
        try {
          const result = await sendTextMessage({
            phoneNumberId,
            accessToken,
            to: sanitizedPhone,
            text: reminderMsg,
          })
          sentMessageId = result.messageId
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[Reminders] Meta API failed for appt ${appt.id} (${kind}):`, msg)
          skipped++
          continue
        }
      }

      // Save the reminder message into the CRM conversation
      let conversationId: string | null = null
      {
        const { data: existing } = await db
          .from('conversations')
          .select('id')
          .eq('user_id', clinic.user_id)
          .eq('contact_id', appt.contact_id)
          .maybeSingle()

        if (existing) {
          conversationId = existing.id as string
        } else {
          const { data: newConv } = await db
            .from('conversations')
            .insert({ user_id: clinic.user_id, contact_id: appt.contact_id })
            .select('id')
            .single()
          conversationId = newConv?.id ?? null
        }
      }

      if (conversationId) {
        await db.from('messages').insert({
          conversation_id: conversationId,
          sender_type:     'bot',
          content_type:    'text',
          content_text:    reminderMsg,
          message_id:      sentMessageId || `reminder-${kind}-${appt.id}-${Date.now()}`,
          status:          sentMessageId ? 'sent' : 'failed',
          created_at:      new Date().toISOString(),
        })

        await db
          .from('conversations')
          .update({
            last_message_text: reminderMsg,
            last_message_at:   new Date().toISOString(),
            updated_at:        new Date().toISOString(),
          })
          .eq('id', conversationId)
      }

      // Mark the reminder as sent so it isn't re-sent on the next cron run
      const flagColumn = kind === '24h' ? 'reminder_24h_sent' : 'reminder_3h_sent'
      await db
        .from('appointments')
        .update({ [flagColumn]: true })
        .eq('id', appt.id)

      console.log(`[Reminders] Sent ${kind} reminder for appt ${appt.id} to ${contact.phone}`)
      processed++
    }
  }

  return NextResponse.json({ processed, skipped })
}
