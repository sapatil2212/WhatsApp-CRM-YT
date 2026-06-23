import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils'

function formatDocName(name: string): string {
  if (!name) return ""
  return name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { appointmentId, type } = body

    if (!appointmentId || !type || (type !== 'feedback' && type !== 'followup')) {
      return NextResponse.json(
        { error: 'appointmentId and type ("feedback" | "followup") are required' },
        { status: 400 }
      )
    }

    // 1. Fetch appointment details with contact and doctor
    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .select(`
        *,
        contact:contacts(*),
        doctor:doctors(*),
        clinic:clinics(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (apptError || !appt) {
      console.error('[Appointments FollowUp] Error fetching appointment:', apptError)
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (!appt.contact || !appt.contact.phone) {
      return NextResponse.json(
        { error: 'Patient contact phone number not found' },
        { status: 400 }
      )
    }

    // 2. Fetch WhatsApp config
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (configError || !config) {
      console.warn('[Appointments FollowUp] WhatsApp config not set up.')
      return NextResponse.json(
        { error: 'WhatsApp integration is not configured for this account.' },
        { status: 400 }
      )
    }

    const accessToken = decrypt(config.access_token)
    const phoneNumberId = config.phone_number_id

    // 3. Resolve or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('contact_id', appt.contact_id)
      .maybeSingle()

    if (!conversation) {
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          contact_id: appt.contact_id,
        })
        .select()
        .single()

      if (newConvError || !newConv) {
        console.error('[Appointments FollowUp] Error creating conversation:', newConvError)
        return NextResponse.json(
          { error: 'Failed to establish conversation log' },
          { status: 500 }
        )
      }
      conversation = newConv
    }

    // 4. Format message text
    const docName = appt.doctor ? formatDocName(appt.doctor.doctor_name) : 'your doctor'
    const clinicName = appt.clinic?.clinic_name || 'our clinic'
    let messageText = ''

    if (type === 'feedback') {
      messageText = `⭐ *How was your visit?*\n\nHi ${appt.contact.name || 'there'}! We hope your appointment with ${docName} went well.\n\nYour feedback helps us improve! Please rate your experience:\n\n1️⃣ Excellent 🌟\n2️⃣ Good 👍\n3️⃣ Average 😐\n4️⃣ Needs Improvement 👎\n\nJust reply with a number. Thank you for choosing *${clinicName}*! 🙏`
    } else {
      messageText = `🩺 *Follow-up Check-in*\n\nHi ${appt.contact.name || 'there'}! It's been a week since your visit with ${docName}.\n\nHow are you feeling? 🤗\n\nIf you need:\n📅 A follow-up appointment\n💊 Prescription refill\n❓ Any questions about your treatment\n\nJust reply here and we'll help you right away!\n\n— *${clinicName}* 🏥`
    }

    // 5. Send message
    let sentMessageId = ''
    const sanitizedPhone = sanitizePhoneForMeta(appt.contact.phone)

    try {
      const result = await sendTextMessage({
        phoneNumberId,
        accessToken,
        to: sanitizedPhone,
        text: messageText,
      })
      sentMessageId = result.messageId
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Appointments FollowUp] Dev mode error fallback for ${type}: ${err.message || err}. Simulating success.`)
        sentMessageId = `sandbox-${type}-${Date.now()}`
      } else {
        console.error(`[Appointments FollowUp] Meta API call failed for ${type}:`, err)
        return NextResponse.json(
          { error: `Meta API failed: ${err.message || err}` },
          { status: 502 }
        )
      }
    }

    // 6. Save bot message in CRM message history
    const { error: msgInsertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'bot',
      content_type: 'text',
      content_text: messageText,
      message_id: sentMessageId,
      status: 'sent',
      created_at: new Date().toISOString(),
    })

    if (msgInsertError) {
      console.error('[Appointments FollowUp] Error inserting bot message:', msgInsertError)
    }

    // 7. Update conversation stats
    const { error: convUpdateError } = await supabase
      .from('conversations')
      .update({
        last_message_text: messageText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    if (convUpdateError) {
      console.error('[Appointments FollowUp] Error updating conversation statistics:', convUpdateError)
    }

    // 8. Update appointment status flag
    const updatePayload = type === 'feedback' ? { feedback_sent: true } : { followup_sent: true }
    await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)

    return NextResponse.json({
      success: true,
      message_id: sentMessageId,
    })
  } catch (error: any) {
    console.error('[Appointments FollowUp] POST internal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
