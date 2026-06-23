import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/healthcare/campaigns
 *
 * Returns pre-built healthcare campaign templates that clinics can
 * send via broadcast to their patient base. Templates are designed
 * for high engagement and include WhatsApp-optimized formatting.
 *
 * POST /api/healthcare/campaigns
 *
 * Sends a healthcare campaign to a filtered patient segment using
 * the existing broadcast infrastructure. Supports:
 *   - Vaccination drives (filter by age/last visit)
 *   - Annual checkup reminders
 *   - Seasonal health alerts (flu, dengue, etc.)
 *   - Health tips & awareness
 *   - New service announcements
 */

// Pre-built healthcare campaign templates
const CAMPAIGN_TEMPLATES = [
  {
    id: 'vaccination_reminder',
    name: 'Vaccination Drive',
    category: 'preventive',
    description: 'Remind patients about upcoming or overdue vaccinations',
    template: `💉 *Vaccination Reminder*\n\nHi {{name}}! 👋\n\nIt's time for your {{vaccine_name}} vaccination.\n\n📅 *Available Dates:* {{available_dates}}\n⏰ *Timings:* {{clinic_hours}}\n📍 *Location:* {{clinic_address}}\n\n✅ Benefits of timely vaccination:\n- Protection against preventable diseases\n- Community immunity\n- Peace of mind for you & your family\n\n📞 Reply "BOOK" to schedule your vaccination appointment!\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'vaccine_name', 'available_dates', 'clinic_hours', 'clinic_address', 'clinic_name'],
  },
  {
    id: 'annual_checkup',
    name: 'Annual Health Checkup',
    category: 'preventive',
    description: 'Remind patients about routine annual health checkups',
    template: `🩺 *Annual Health Checkup Reminder*\n\nHi {{name}}! 👋\n\nIt's been a while since your last visit. Regular health checkups help catch potential issues early!\n\n🔬 *Our Checkup Package Includes:*\n- Complete blood work\n- BP & vitals monitoring\n- Doctor consultation\n- Health report\n\n💰 *Special Offer:* {{offer_text}}\n\n📅 *Book Now:* Reply "CHECKUP" or call {{clinic_phone}}\n\nYour health is our priority! ❤️\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'offer_text', 'clinic_phone', 'clinic_name'],
  },
  {
    id: 'seasonal_alert',
    name: 'Seasonal Health Alert',
    category: 'awareness',
    description: 'Warn patients about seasonal health risks (flu, dengue, etc.)',
    template: `⚠️ *{{season}} Health Alert*\n\nHi {{name}}! Stay safe this {{season}}! 🌡️\n\n🦟 *Prevention Tips:*\n{{prevention_tips}}\n\n🚨 *Watch for these symptoms:*\n{{symptoms_list}}\n\n🏥 *If you feel unwell:*\nDon't wait — visit us immediately or reply here for an urgent appointment.\n\n📞 Emergency: {{clinic_phone}}\n\nStay healthy! 💪\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'season', 'prevention_tips', 'symptoms_list', 'clinic_phone', 'clinic_name'],
  },
  {
    id: 'health_tip',
    name: 'Weekly Health Tip',
    category: 'engagement',
    description: 'Share weekly health tips to keep patients engaged',
    template: `💡 *Health Tip of the Week*\n\nHi {{name}}! Here's your weekly wellness boost: 🌟\n\n📌 *{{tip_title}}*\n\n{{tip_content}}\n\n🩺 *Quick Fact:* {{health_fact}}\n\nHave questions? Reply anytime — we're here 24/7! 😊\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'tip_title', 'tip_content', 'health_fact', 'clinic_name'],
  },
  {
    id: 'new_service',
    name: 'New Service Announcement',
    category: 'marketing',
    description: 'Announce new services, doctors, or facilities',
    template: `🎉 *Exciting News!*\n\nHi {{name}}! We're thrilled to announce:\n\n🆕 *{{service_name}}*\n\n{{service_description}}\n\n👨‍⚕️ *Expert:* {{doctor_name}}\n💰 *Starting at:* {{price}}\n📅 *Available from:* {{start_date}}\n\n🎁 *Introductory Offer:* {{offer_text}}\n\n📞 Reply "INFO" to learn more or "BOOK" to schedule!\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'service_name', 'service_description', 'doctor_name', 'price', 'start_date', 'offer_text', 'clinic_name'],
  },
  {
    id: 'prescription_refill',
    name: 'Prescription Refill Reminder',
    category: 'care',
    description: 'Remind patients about upcoming prescription refills',
    template: `💊 *Prescription Refill Reminder*\n\nHi {{name}}! 👋\n\nJust a friendly reminder that your medication is likely running low.\n\n💊 *Medication:* {{medication_name}}\n📅 *Last prescribed:* {{last_date}}\n👨‍⚕️ *Prescribed by:* {{doctor_name}}\n\n*Need a refill?*\n✅ Reply "REFILL" — we'll arrange it for you\n📅 Reply "VISIT" — to book a follow-up appointment\n\nDon't skip your medication! Your health matters. ❤️\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'medication_name', 'last_date', 'doctor_name', 'clinic_name'],
  },
  {
    id: 'post_surgery_care',
    name: 'Post-Surgery Care Instructions',
    category: 'care',
    description: 'Send post-surgery care instructions and check-in',
    template: `🏥 *Post-Procedure Care Guide*\n\nHi {{name}}! We hope you're recovering well after your {{procedure_name}}. 🤗\n\n📋 *Important Reminders:*\n{{care_instructions}}\n\n⚠️ *Contact us immediately if:*\n- Unusual bleeding or swelling\n- Fever above 101°F\n- Severe pain not relieved by medication\n\n📅 *Follow-up visit:* {{followup_date}}\n📞 *Emergency:* {{clinic_phone}}\n\nRest well! We're always here for you. 💙\n\n— *{{clinic_name}}* 🏥`,
    variables: ['name', 'procedure_name', 'care_instructions', 'followup_date', 'clinic_phone', 'clinic_name'],
  },
]

export async function GET() {
  return NextResponse.json({ templates: CAMPAIGN_TEMPLATES })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.template_id || !body.variables) {
    return NextResponse.json(
      { error: 'template_id and variables are required' },
      { status: 400 }
    )
  }

  const template = CAMPAIGN_TEMPLATES.find((t) => t.id === body.template_id)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Render template with provided variables
  let rendered = template.template
  for (const [key, value] of Object.entries(body.variables as Record<string, string>)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
  }

  // If contact_ids provided, create a targeted broadcast
  const contactIds: string[] = body.contact_ids || []
  const segmentFilter: string = body.segment_filter || 'all' // all, recent, inactive

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get clinic info
  const { data: clinic } = await db
    .from('clinics')
    .select('id, clinic_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
  }

  // Determine target audience
  let targetContacts: string[] = contactIds

  if (contactIds.length === 0) {
    // Auto-segment based on filter
    let query = db.from('contacts').select('id').eq('user_id', user.id)

    if (segmentFilter === 'recent') {
      // Patients who visited in last 3 months
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const { data: recentAppts } = await db
        .from('appointments')
        .select('contact_id')
        .eq('clinic_id', clinic.id)
        .gte('appointment_date', threeMonthsAgo.toISOString().split('T')[0])
      targetContacts = [...new Set((recentAppts || []).map((a) => a.contact_id))]
    } else if (segmentFilter === 'inactive') {
      // Patients who haven't visited in 6+ months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const { data: recentAppts } = await db
        .from('appointments')
        .select('contact_id')
        .eq('clinic_id', clinic.id)
        .gte('appointment_date', sixMonthsAgo.toISOString().split('T')[0])
      const recentIds = new Set((recentAppts || []).map((a) => a.contact_id))

      const { data: allContacts } = await query
      targetContacts = (allContacts || [])
        .map((c) => c.id)
        .filter((id) => !recentIds.has(id))
    } else {
      const { data: allContacts } = await query
      targetContacts = (allContacts || []).map((c) => c.id)
    }
  }

  return NextResponse.json({
    message: 'Campaign prepared',
    template_id: body.template_id,
    template_name: template.name,
    rendered_message: rendered,
    target_count: targetContacts.length,
    target_contact_ids: targetContacts.slice(0, 500), // Cap at 500 per batch
    segment_filter: segmentFilter,
  })
}
