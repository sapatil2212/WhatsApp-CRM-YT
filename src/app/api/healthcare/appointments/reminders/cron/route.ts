import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils'

function formatDocName(name: string): string {
  if (!name) return ''
  return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`
}

async function processReminders(db: any) {
  // 1. Fetch scheduled appointments that are upcoming and need reminders.
  // We query all appointments where status is 'scheduled' and at least one of the reminder flags is false.
  const { data: appts, error: apptsError } = await db
    .from('appointments')
    .select(`
      *,
      contact:contacts(*),
      doctor:doctors(*),
      clinic:clinics(*)
    `)
    .eq('status', 'scheduled')
    .or('reminder_24h_sent.eq.false,reminder_3h_sent.eq.false')

  if (apptsError) {
    console.error('[Reminders Cron] Error fetching appointments:', apptsError)
    throw new Error(`Failed to fetch appointments: ${apptsError.message}`)
  }

  if (!appts || appts.length === 0) {
    return 0
  }

  let processedCount = 0
  const now = new Date()

  for (const appt of appts) {
    if (!appt.contact || !appt.contact.phone) continue

    // Parse appointment date and time.
    // appointment_date is YYYY-MM-DD, appointment_time is HH:MM.
    const [year, month, day] = appt.appointment_date.split('-').map(Number)
    const [hour, minute] = appt.appointment_time.split(':').map(Number)
    // Month is 0-indexed in JavaScript Date
    const apptDateTime = new Date(year, month - 1, day, hour, minute, 0)

    const diffMs = apptDateTime.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // Skip appointments that are in the past
    if (diffHours <= 0) continue

    let send24h = false
    let send3h = false

    // Decide which reminder to send
    if (diffHours <= 3 && !appt.reminder_3h_sent) {
      send3h = true
    } else if (diffHours > 3 && diffHours <= 24 && !appt.reminder_24h_sent) {
      send24h = true
    }

    if (!send24h && !send3h) continue

    // Resolve the clinic owner's user_id to query their WhatsApp configurations
    const clinicUserId = appt.clinic?.user_id
    if (!clinicUserId) continue

    const { data: config, error: configError } = await db
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', clinicUserId)
      .maybeSingle()

    if (configError || !config) {
      console.warn(`[Reminders Cron] WhatsApp integration is not configured for clinic user ${clinicUserId}`)
      continue
    }

    let accessToken: string
    try {
      accessToken = decrypt(config.access_token)
    } catch (decError: any) {
      console.error(`[Reminders Cron] Failed to decrypt access token for user ${clinicUserId}:`, decError.message || decError)
      continue
    }

    const phoneNumberId = config.phone_number_id
    const sanitizedPhone = sanitizePhoneForMeta(appt.contact.phone)

    // Format the reminder message
    const docName = formatDocName(appt.doctor?.doctor_name)
    const specializationStr = appt.doctor?.specialization ? ` (${appt.doctor.specialization})` : ''
    
    let messageText = ''
    if (send3h) {
      messageText = `Reminder: You have an appointment scheduled with ${docName}${specializationStr} today at ${appt.appointment_time} (in 3 hours). We look forward to seeing you soon!`
    } else {
      const formattedDate = apptDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      messageText = `Reminder: You have an upcoming appointment scheduled with ${docName}${specializationStr} tomorrow, ${formattedDate} at ${appt.appointment_time}. Please reply to this message if you need to reschedule or cancel.`
    }

    // Send the message (simulate in development/sandbox mode)
    let sentMessageId = ''
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Reminders Cron] Development Sandbox: Simulating reminder message to ${sanitizedPhone}`)
      sentMessageId = `sandbox-reminder-${send3h ? '3h' : '24h'}-${Date.now()}`
    } else {
      try {
        const result = await sendTextMessage({
          phoneNumberId,
          accessToken,
          to: sanitizedPhone,
          text: messageText,
        })
        sentMessageId = result.messageId
      } catch (err: any) {
        console.error(`[Reminders Cron] Meta API call failed for appointment ${appt.id}:`, err.message || err)
        continue // Skip logging and database updates if sending failed
      }
    }

    // 1. Resolve or create CRM conversation
    let { data: conversation } = await db
      .from('conversations')
      .select('*')
      .eq('user_id', clinicUserId)
      .eq('contact_id', appt.contact_id)
      .maybeSingle()

    if (!conversation) {
      const { data: newConv, error: newConvError } = await db
        .from('conversations')
        .insert({
          user_id: clinicUserId,
          contact_id: appt.contact_id,
        })
        .select()
        .single()

      if (newConvError || !newConv) {
        console.error('[Reminders Cron] Error establishing conversation:', newConvError)
        continue
      }
      conversation = newConv
    }

    // 2. Insert Bot message to CRM messages table
    const { error: msgInsertError } = await db.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'bot',
      content_type: 'text',
      content_text: messageText,
      message_id: sentMessageId,
      status: 'sent',
      created_at: new Date().toISOString(),
    })

    if (msgInsertError) {
      console.error('[Reminders Cron] Bot reminder CRM log failed:', msgInsertError)
    }

    // 3. Update Conversation last message statistics
    const { error: convUpdateError } = await db
      .from('conversations')
      .update({
        last_message_text: messageText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    if (convUpdateError) {
      console.error('[Reminders Cron] Conversation CRM update failed:', convUpdateError)
    }

    // 4. Update the reminder flags on the appointment record
    const updates: Record<string, boolean> = {}
    if (send3h) {
      updates.reminder_3h_sent = true
      updates.reminder_24h_sent = true // Mark both true so we don't try to send a 24h reminder in the future
    } else if (send24h) {
      updates.reminder_24h_sent = true
    }

    const { error: updateError } = await db
      .from('appointments')
      .update(updates)
      .eq('id', appt.id)

    if (updateError) {
      console.error(`[Reminders Cron] Error updating reminder flags on appointment ${appt.id}:`, updateError)
    } else {
      processedCount++
    }
  }

  return processedCount
}

export async function GET(request: Request) {
  try {
    const expected = process.env.AUTOMATION_CRON_SECRET
    const supplied = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret')

    if (process.env.NODE_ENV !== 'development' && !expected) {
      return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
    }

    const bypassAuth = process.env.NODE_ENV === 'development' && !expected
    if (!bypassAuth && supplied !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = supabaseAdmin()
    const processed = await processReminders(db)

    return NextResponse.json({ success: true, processed })
  } catch (error: any) {
    console.error('[Reminders Cron] GET internal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const expected = process.env.AUTOMATION_CRON_SECRET
    const supplied = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret')

    if (process.env.NODE_ENV !== 'development' && !expected) {
      return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
    }

    const bypassAuth = process.env.NODE_ENV === 'development' && !expected
    if (!bypassAuth && supplied !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = supabaseAdmin()
    const processed = await processReminders(db)

    return NextResponse.json({ success: true, processed })
  } catch (error: any) {
    console.error('[Reminders Cron] POST internal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
