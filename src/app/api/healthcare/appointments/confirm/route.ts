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
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      )
    }

    // 1. Fetch appointment details with contact and doctor
    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .select(`
        *,
        contact:contacts(*),
        doctor:doctors(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (apptError || !appt) {
      console.error('[Appointments Confirmation] Error fetching appointment:', apptError)
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
      console.warn('[Appointments Confirmation] WhatsApp config not set up.')
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
        console.error('[Appointments Confirmation] Error creating conversation:', newConvError)
        return NextResponse.json(
          { error: 'Failed to establish conversation log' },
          { status: 500 }
        )
      }
      conversation = newConv
    }

    // 4. Format confirmation text
    const docName = formatDocName(appt.doctor?.doctor_name)
    const formattedDate = new Date(appt.appointment_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    const specializationStr = appt.doctor?.specialization ? ` (${appt.doctor.specialization})` : ''
    const messageText = `Your appointment with ${docName}${specializationStr} has been successfully confirmed for ${formattedDate} at ${appt.appointment_time}. We look forward to seeing you!`

    // 5. Send message
    let sentMessageId = ''
    const sanitizedPhone = sanitizePhoneForMeta(appt.contact.phone)

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Appointments Confirmation] Development Sandbox: Simulating success.')
      sentMessageId = `sandbox-confirm-${Date.now()}`
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
        console.error('[Appointments Confirmation] Meta API call failed:', err)
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
      console.error('[Appointments Confirmation] Error inserting bot confirmation message:', msgInsertError)
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
      console.error('[Appointments Confirmation] Error updating conversation statistics:', convUpdateError)
    }

    return NextResponse.json({
      success: true,
      message_id: sentMessageId,
    })
  } catch (error: any) {
    console.error('[Appointments Confirmation] POST internal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
