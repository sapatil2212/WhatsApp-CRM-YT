import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { processHealthcareAIMessage } from '@/services/ai-healthcare.service'

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
    const { conversationId, messageText } = body

    if (!conversationId || !messageText) {
      return NextResponse.json(
        { error: 'conversationId and messageText are required' },
        { status: 400 }
      )
    }

    // Fetch conversation and contact
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const contact = conversation.contact
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 400 }
      )
    }

    // 1. Insert patient's simulated message into messages table
    const simulatedMsgId = `sim-user-${Date.now()}`
    const { data: messageRecord, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'customer',
        content_type: 'text',
        content_text: messageText,
        message_id: simulatedMsgId,
        status: 'delivered',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (msgError) {
      console.error('[Simulate Incoming] Error inserting patient message:', msgError)
      return NextResponse.json(
        { error: `Failed to insert simulated message: ${msgError.message}` },
        { status: 500 }
      )
    }

    // 2. Update conversation last message stats
    await supabase
      .from('conversations')
      .update({
        last_message_text: messageText,
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    // 3. Fetch WhatsApp config if available
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const accessToken = config ? decrypt(config.access_token) : 'dummy-token'
    const phoneNumberId = config ? config.phone_number_id : 'dummy-phone-id'

    // 4. Run AI healthcare auto-responder synchronously so we can await the result
    const aiHandled = await processHealthcareAIMessage({
      messageText,
      senderPhone: contact.phone,
      contactId: contact.id,
      userId: user.id,
      conversationId,
      contextMessageId: simulatedMsgId,
      accessToken,
      phoneNumberId,
    }).catch((err) => {
      console.error('[Simulate Incoming] processHealthcareAIMessage threw error:', err)
      return false
    })

    return NextResponse.json({
      success: true,
      message_id: messageRecord.id,
      aiHandled,
    })
  } catch (error: any) {
    console.error('Error in Simulate Incoming POST:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
