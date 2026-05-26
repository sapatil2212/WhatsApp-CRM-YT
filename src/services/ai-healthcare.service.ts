/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'

function formatDocName(name: string): string {
  if (!name) return ''
  return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`
}

function cleanDoctorName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^dr\.?\s+/, '') // strip leading "dr." or "dr "
    .replace(/^doctor\s+/, '') // strip leading "doctor "
    .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric chars
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─── Server-side booking context extractor ────────────────────────────────
// Scans the patient's own messages (oldest→newest) for doctor name, date and
// time mentions. Returns the most recently confirmed values so they can be
// injected as hard facts — the AI copies them to booking_details instead of
// re-extracting from chat history (which it does unreliably).
const MONTHS_FULL  = ['january','february','march','april','may','june','july','august','september','october','november','december']
const MONTHS_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function extractBookingContext(
  pastMessages: any[],
  doctors: any[]
): { doctor_name: string | null; date: string | null; time: string | null } {
  const ctx: { doctor_name: string | null; date: string | null; time: string | null } =
    { doctor_name: null, date: null, time: null }

  const patientMsgs = [...(pastMessages || [])]
    .reverse() // oldest first so later messages overwrite earlier
    .filter((m) => m.sender_type === 'customer' && m.content_text)
    .map((m) => m.content_text as string)

  const nowYear = new Date().getFullYear()

  for (const msg of patientMsgs) {
    const lower = msg.toLowerCase()

    // ── Doctor name ──────────────────────────────────────────────────────
    for (const doc of doctors || []) {
      const bare = (doc.doctor_name as string)
        .toLowerCase()
        .replace(/^dr\.?\s+/i, '')
        .trim()
      if (bare && (lower.includes(bare) || lower.includes(doc.doctor_name.toLowerCase()))) {
        ctx.doctor_name = doc.doctor_name
        break
      }
    }

    // ── Date: ISO  2026-05-30 ────────────────────────────────────────────
    const isoMatch = msg.match(/\b(\d{4}-\d{2}-\d{2})\b/)
    if (isoMatch) { ctx.date = isoMatch[1]; continue }

    // ── Date: "30 May", "May 30", "30th May", "May 30th" ────────────────
    for (let mi = 0; mi < MONTHS_FULL.length; mi++) {
      const mFull  = MONTHS_FULL[mi]
      const mShort = MONTHS_SHORT[mi]
      const dayRe  = '(\\d{1,2})(?:st|nd|rd|th)?'
      const patterns = [
        new RegExp(`\\b${dayRe}\\s+${mFull}\\b`),
        new RegExp(`\\b${mFull}\\s+${dayRe}\\b`),
        new RegExp(`\\b${dayRe}\\s+${mShort}\\b`),
        new RegExp(`\\b${mShort}\\s+${dayRe}\\b`),
      ]
      let found = false
      for (const re of patterns) {
        const m = lower.match(re)
        if (m) {
          const day = String(m[1]).padStart(2, '0')
          const mon = String(mi + 1).padStart(2, '0')
          ctx.date = `${nowYear}-${mon}-${day}`
          found = true
          break
        }
      }
      if (found) break
    }

    // ── Time: "11 AM", "11:00", "9:30 am" ───────────────────────────────
    const ampmMatch = msg.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    if (ampmMatch) {
      let hr = parseInt(ampmMatch[1])
      const mn = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0
      if (ampmMatch[3].toLowerCase() === 'pm' && hr !== 12) hr += 12
      if (ampmMatch[3].toLowerCase() === 'am' && hr === 12) hr = 0
      ctx.time = `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`
    } else {
      const hhmm = msg.match(/\b(\d{2}):(\d{2})\b/)
      if (hhmm) ctx.time = `${hhmm[1]}:${hhmm[2]}`
    }
  }

  return ctx
}
// ──────────────────────────────────────────────────────────────────────────

// ─── Gemini circuit breaker ────────────────────────────────────────────────
// After a hard Gemini failure (404 / permanent quota exhaustion) skip ALL
// Gemini calls for GEMINI_CIRCUIT_OPEN_MS and go straight to OpenAI.
// Resets automatically after the window expires (or on server restart).
const GEMINI_CIRCUIT_OPEN_MS = 60_000 // 60 seconds
let geminiCircuitOpenUntil = 0        // Unix-ms; 0 = circuit closed (Gemini available)
// ──────────────────────────────────────────────────────────────────────────

function getWeekdayName(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  return WEEKDAYS[dateObj.getDay()]
}

function getLocalDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getNext7Days(): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface OpenAIResponse {
  detected_intent: string
  ai_response: string
  confidence_score: number
  is_escalation: boolean
  booking_details?: {
    doctor_name?: string
    date?: string // YYYY-MM-DD
    time?: string // HH:MM
  }
}

/**
 * Main function to process incoming patient messages through AI Healthcare Automation.
 */
export async function processHealthcareAIMessage(options: {
  messageText: string
  senderPhone: string
  contactId: string
  userId: string
  conversationId: string
  contextMessageId?: string
  accessToken: string
  phoneNumberId: string
  isFirstInboundMessage?: boolean
}): Promise<boolean> {
  const {
    messageText,
    senderPhone,
    contactId,
    userId,
    conversationId,
    contextMessageId,
    accessToken,
    phoneNumberId,
    isFirstInboundMessage,
  } = options

  const db = getSupabaseAdmin()

  // 1. Fetch clinic configuration
  const { data: clinic, error: clinicError } = await db
    .from('clinics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (clinicError || !clinic) {
    console.log('[AI Healthcare] No clinic registered for this user ID:', userId)
    return false
  }

  // 2. Fetch AI settings
  const { data: aiSettings, error: settingsError } = await db
    .from('ai_settings')
    .select('*')
    .eq('clinic_id', clinic.id)
    .maybeSingle()

  if (settingsError || !aiSettings || !aiSettings.ai_enabled) {
    console.log('[AI Healthcare] AI automation is disabled or not set up.')
    return false
  }

  const userQuery = messageText.trim().toLowerCase()

  // 3. Pre-check emergency & escalation keywords.
  // Use whole-word boundary matching so a keyword like "doctor" does NOT
  // fire on "Tell me about doctors" — it must appear as a standalone word.
  function matchesKeyword(text: string, kw: string): boolean {
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i').test(text)
  }

  const isEmergency  = aiSettings.emergency_keywords?.some((kw: string) => matchesKeyword(userQuery, kw))
  const isEscalation = aiSettings.escalation_keywords?.some((kw: string) => matchesKeyword(userQuery, kw))

  if (isEmergency || isEscalation) {
    console.log('[AI Healthcare] Emergency or escalation keyword matched.')
    await handleHumanEscalation({
      db,
      clinic,
      aiSettings,
      contactId,
      conversationId,
      userMessage: messageText,
      intent: isEmergency ? 'emergency' : 'human_handover',
      reason: isEmergency
        ? 'Matched emergency keyword.'
        : 'Matched escalation keyword.',
      accessToken,
      phoneNumberId,
      senderPhone,
      contextMessageId,
    })
    return true
  }

  // 4. Fetch all clinic context data and recent message history
  const now = new Date()
  const todayStr = getLocalDateString(now)
  const [
    { data: timings },
    { data: doctors },
    { data: services },
    { data: faqs },
    { data: pastMessages },
    { data: upcomingAppointments },
  ] = await Promise.all([
    db.from('clinic_timings').select('*').eq('clinic_id', clinic.id),
    db.from('doctors').select('*').eq('clinic_id', clinic.id),
    db.from('clinic_services').select('*').eq('clinic_id', clinic.id).eq('is_active', true),
    db.from('clinic_faqs').select('*').eq('clinic_id', clinic.id),
    db.from('messages')
      .select('sender_type, content_text, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('appointments')
      .select('doctor_id, appointment_date, appointment_time, status')
      .eq('clinic_id', clinic.id)
      .neq('status', 'cancelled')
      .gte('appointment_date', todayStr),
  ])

  // NOTE: The AI operates 24/7. There is no after-hours early exit.

  // ── Server-side booking context ────────────────────────────────────────
  // Extract any confirmed doctor/date/time from the patient's own prior
  // messages so they can be injected as hard facts into the prompt.
  const confirmedCtx = extractBookingContext(pastMessages ?? [], doctors ?? [])
  const confirmedBookingSection = (confirmedCtx.doctor_name || confirmedCtx.date || confirmedCtx.time)
    ? `\n### CONFIRMED BOOKING DETAILS FROM THIS CONVERSATION:\n` +
      `These were explicitly provided by the patient in earlier messages. ` +
      `Copy them EXACTLY into your booking_details JSON. Do NOT change or override them.\n` +
      (confirmedCtx.doctor_name ? `- Doctor: ${confirmedCtx.doctor_name}\n` : '') +
      (confirmedCtx.date
        ? `- Date: ${confirmedCtx.date} (${WEEKDAYS[new Date(confirmedCtx.date + 'T00:00:00').getDay()]})\n`
        : '') +
      (confirmedCtx.time ? `- Time: ${confirmedCtx.time}\n` : '')
    : ''

  // NOTE: greeting_message is injected into the system prompt below so the
  // AI adapts it according to the 24/7 rules, rather than being sent verbatim
  // (verbatim sends bypassed all safety rules and could contain "closed" text).

  // Build the prompt context
  const timingsContext = (timings || [])
    .map(
      (t) =>
        `${t.day_name}: ${t.is_closed ? 'Closed' : `${t.opening_time} - ${t.closing_time} (Break: ${t.lunch_break_start || 'None'} - ${t.lunch_break_end || 'None'})`}`
    )
    .join('\n')

  const clinicExceptionsContext = (clinic.date_exceptions || [])
    .map(
      (e: any) => {
        const weekday = getWeekdayName(e.date)
        return `- ${e.date} (${weekday}): ${e.is_closed ? 'Closed all day' : `Special timings: ${e.opening_time} - ${e.closing_time}`} (${e.reason || 'Holiday'})`
      }
    )
    .join('\n')

  const doctorsContext = (doctors || [])
    .map((d) => {
      // Format weekly slots
      const daysWithSlots = Object.entries(d.weekly_slots || {})
        .map(([day, slots]: [string, any]) => {
          const activeSlots = (slots || [])
            .filter((s: any) => s.is_active)
            .map((s: any) => `${s.start_time}-${s.end_time}`)
            .join(', ');
          return activeSlots ? `${day}: [${activeSlots}]` : `${day}: No slots`;
        })
        .filter((str) => !str.includes('No slots'))
        .join('; ');

      // Format doctor exceptions
      const docExceptions = (d.date_exceptions || [])
        .map((e: any) => {
          const weekday = getWeekdayName(e.date)
          return `${e.date} (${weekday}) (${!e.is_available ? 'Leave/Unavailable' : 'Available with custom slots'}): ${e.reason || 'No reason'}`
        })
        .join('; ');

      return `- ${formatDocName(d.doctor_name)} (${d.specialization || 'General'}). Qualifications: ${d.qualification || 'N/A'}. Experience: ${d.experience || 'N/A'}. Fee: ₹${d.consultation_fee || 0}. Default Shift: ${d.available_days?.join(', ') || 'None'} from ${d.available_start_time || 'N/A'} to ${d.available_end_time || 'N/A'}. Weekly Slots: ${daysWithSlots || 'None (falls back to default shift)'}. Leaves/Exceptions: ${docExceptions || 'None'}.`;
    })
    .join('\n')

  const servicesContext = (services || [])
    .map((s) => `- ${s.service_name}: ${s.description || ''} (Starts at ₹${s.starting_price || 0}, duration ${s.duration || 30} mins)`)
    .join('\n')

  const faqsContext = (faqs || [])
    .map((f) => `Q: "${f.question}"\nA: "${f.answer}" (Keywords: ${f.keywords || 'None'})`)
    .join('\n')

  // Format past messages as recent conversation history (oldest first)
  const reversedMessages = (pastMessages || []) as any[]
  const chatHistoryText = [...reversedMessages]
    .reverse()
    .filter((m) => m.content_text)
    .map((m) => {
      const sender = m.sender_type === 'customer'
        ? 'Patient'
        : m.sender_type === 'bot'
        ? 'AI Assistant'
        : 'Agent'
      return `${sender}: ${m.content_text}`
    })
    .join('\n')

  // Format active upcoming appointments as reserved slots
  const appointmentsContext = (upcomingAppointments || [])
    .map((a: any) => {
      const doc = (doctors || []).find((d) => d.id === a.doctor_id)
      const docName = doc ? formatDocName(doc.doctor_name) : 'Unknown Doctor'
      const weekday = getWeekdayName(a.appointment_date)
      return `- ${docName} is BOOKED on ${a.appointment_date} (${weekday}) at ${a.appointment_time}`
    })
    .join('\n')

  // Pre-calculate free slots for all doctors for today and next 6 days (7 days total)
  const next3Days = getNext7Days()
  const freeSlotsContextParts: string[] = []

  for (const doc of doctors || []) {
    const docName = formatDocName(doc.doctor_name)
    freeSlotsContextParts.push(`- ${docName}:`)

    let hasAnySlotsForDoctor = false

    for (const d of next3Days) {
      const dateStr = getLocalDateString(d)
      const weekday = WEEKDAYS[d.getDay()]
      const monthName = MONTHS[d.getMonth()]
      const dayNum = d.getDate()
      // Put weekday name FIRST so the AI copies it verbatim rather than recomputing.
      // Include the ISO date string so the AI never needs to infer the date either.
      const dateLabel = `${weekday.toUpperCase()} ${monthName} ${dayNum} [${dateStr}]`

      // 1. Check clinic exceptions (holidays)
      const clinicEx = (clinic.date_exceptions || []).find((e: any) => e.date === dateStr)
      if (clinicEx && clinicEx.is_closed) {
        continue
      }

      // 2. Check clinic timings for that weekday.
      // Only block the day when the clinic EXPLICITLY marks it as closed
      // (is_closed: true). A missing timing entry means the day was not
      // configured in the clinic setup — in that case we defer to the
      // doctor's own available_days (step 4) instead of hard-blocking.
      const clinicTiming = (timings || []).find(
        (t) => t.day_name.toLowerCase() === weekday.toLowerCase()
      )
      if (!clinicEx && clinicTiming && clinicTiming.is_closed) {
        continue
      }

      // 3. Check doctor exceptions (leave)
      const docEx = (doc.date_exceptions || []).find((e: any) => e.date === dateStr)
      if (docEx && !docEx.is_available) {
        continue
      }

      // 4. Check doctor availability days
      if (!docEx) {
        const isAvailableDay = doc.available_days?.some(
          (day: string) => day.toLowerCase() === weekday.toLowerCase()
        )
        if (!isAvailableDay) {
          continue
        }
      }

      // 5. Determine active slots for this day
      let slotsForDay: any[] = []
      if (docEx && docEx.slots && docEx.slots.length > 0) {
        slotsForDay = docEx.slots.filter((s: any) => s.is_active)
      } else if (doc.weekly_slots && doc.weekly_slots[weekday]) {
        slotsForDay = doc.weekly_slots[weekday].filter((s: any) => s.is_active)
      }

      // 6. Generate or select times
      let times: string[] = []
      if (slotsForDay.length > 0) {
        times = slotsForDay.map((s: any) => s.start_time)
      } else {
        // Fallback: standard shift hours split by hour
        const startTimeStr = doc.available_start_time || '09:00'
        const endTimeStr = doc.available_end_time || '17:00'
        const [startHour] = startTimeStr.split(':').map(Number)
        const [endHour] = endTimeStr.split(':').map(Number)
        for (let hour = startHour; hour < endHour; hour++) {
          times.push(`${String(hour).padStart(2, '0')}:00`)
        }
      }

      // 7. Filter out lunch break and booked slots
      const activeClinicTiming = clinicTiming || (timings || []).find(
        (t) => t.day_name.toLowerCase() === weekday.toLowerCase()
      )
      const lunchStart = activeClinicTiming?.lunch_break_start ? Number(activeClinicTiming.lunch_break_start.replace(':', '')) : null
      const lunchEnd = activeClinicTiming?.lunch_break_end ? Number(activeClinicTiming.lunch_break_end.replace(':', '')) : null

      const freeTimes: string[] = []
      for (const timeStr of times) {
        const formattedTime = timeStr.substring(0, 5)

        // Filter out past slots for the current day
        if (dateStr === todayStr) {
          const [sHour, sMin] = formattedTime.split(':').map(Number)
          const slotVal = sHour * 100 + sMin
          const nowObj = new Date()
          const nowVal = nowObj.getHours() * 100 + nowObj.getMinutes()
          if (slotVal <= nowVal) {
            continue
          }
        }

        // Lunch break check
        if (lunchStart !== null && lunchEnd !== null) {
          const timeVal = Number(formattedTime.replace(':', ''))
          if (timeVal >= lunchStart && timeVal < lunchEnd) {
            continue
          }
        }

        // Booked check
        const isBooked = (upcomingAppointments || []).some((appt: any) => {
          return (
            appt.doctor_id === doc.id &&
            appt.appointment_date === dateStr &&
            appt.appointment_time === formattedTime
          )
        })

        if (!isBooked) {
          freeTimes.push(formattedTime)
        }
      }

      if (freeTimes.length > 0) {
        hasAnySlotsForDoctor = true
        freeSlotsContextParts.push(`  * ${dateLabel}: ${freeTimes.join(', ')}`)
      }
    }

    if (!hasAnySlotsForDoctor) {
      freeSlotsContextParts.push(`  * No slots available for the next 7 days.`)
    }
  }

  const freeSlotsContext = freeSlotsContextParts.join('\n')

  // Build an authoritative 7-day date reference so the AI can look up
  // any weekday instead of computing it (AI calendar arithmetic is unreliable).
  const dateReferenceCalendar = next3Days
    .map((d) => {
      const wday = WEEKDAYS[d.getDay()]
      const mon  = MONTHS[d.getMonth()]
      const day  = d.getDate()
      const iso  = getLocalDateString(d)
      return `${wday.toUpperCase()} ${mon} ${day} [${iso}]`
    })
    .join('\n')

  const todayLabel = `${WEEKDAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  // 5. Call OpenAI API for intent detection and response generation
  const systemPrompt = `You are a professional, polite, and helpful AI assistant for "${clinic.clinic_name}" (${clinic.clinic_description || 'Healthcare clinic'}).
Your tone is "${aiSettings.ai_tone || 'polite'}".

### CLINIC INFORMATION:
Address: ${clinic.address || ''}, ${clinic.city || ''}, ${clinic.state || ''} - ${clinic.pincode || ''}
Phone: ${clinic.phone || ''}
WhatsApp: ${clinic.whatsapp_number || ''}
Email: ${clinic.email || ''}
Website: ${clinic.website || ''}
Google Maps: ${clinic.google_map_link || ''}

### TODAY'S DATE:
Today is ${todayLabel}.
You are a 24/7 AI assistant. You are ALWAYS available and ALWAYS respond helpfully — at any hour, any day. The working hours below are shown purely so you can inform patients of visiting hours; they do NOT limit when you reply or help.
${isFirstInboundMessage && aiSettings.greeting_message ? `
### FIRST MESSAGE — WELCOME TONE:
This is the patient's very first message. Warmly welcome them using the spirit of this greeting (adapt it — do NOT copy it verbatim if it contains any outdated or incorrect phrasing): "${aiSettings.greeting_message.replace(/"/g, "'")}"
` : ''}

### 7-DAY DATE REFERENCE (authoritative — use this to look up weekday names, NEVER compute them yourself):
${dateReferenceCalendar}

### WORKING HOURS:
${timingsContext || 'No hours configured yet.'}

### CLINIC TIMING EXCEPTIONS / HOLIDAYS:
${clinicExceptionsContext || 'No holiday exceptions configured.'}

### DOCTORS:
${doctorsContext || 'No doctors registered yet.'}

### CURRENT BOOKINGS / RESERVED SLOTS:
${appointmentsContext || 'No active bookings registered.'}

### DYNAMICALLY CALCULATED FREE SLOTS FOR THE NEXT 7 DAYS:
⚠️ Each entry uses the format "WEEKDAY MONTH DAY [YYYY-MM-DD]". The WEEKDAY is pre-computed server-side and is authoritative — copy it exactly into your response. NEVER override or recompute the weekday from the date string.
${freeSlotsContext || 'No free slots available.'}

### SERVICES OFFERED:
${servicesContext || 'No services configured.'}

### FREQUENTLY ASKED QUESTIONS (FAQs):
${faqsContext || 'No FAQs registered.'}

### RECENT CONVERSATION HISTORY:
${chatHistoryText || 'No previous messages.'}

### SUPPORTED LANGUAGES:
${(aiSettings.supported_languages || ['English']).join(', ')}
Detect the language the patient is writing in. If they write in one of the supported languages above, ALWAYS respond in that same language. If they write in an unsupported language, respond in English and politely inform them that you currently support: ${(aiSettings.supported_languages || ['English']).join(', ')}.

### CRITICAL RULES (these override everything else):
- NEVER say the clinic is closed, unavailable, or that a representative will get back to them later. You are a 24/7 assistant — always respond and always help.
- SMART ACKNOWLEDGMENT HANDLING: If the patient sends a short acknowledgment word (e.g. "ok", "okay", "sure", "alright", "fine", "got it", "noted", "yes", "yep", "hmm", "k") — do NOT respond with a generic welcome or greeting. Instead, look at the "### RECENT CONVERSATION HISTORY" section and continue the conversation naturally from where it left off. Example: if the last bot message asked them to choose a time slot, and they say "ok", gently re-prompt with the available options.
- NEVER end or abandon the conversation. Keep engaging until the patient clearly signals they are done (e.g. says "thank you bye", "goodbye", "that's all", "no more questions"). When they do, respond warmly (e.g. "Thank you! Have a great day! 😊 Feel free to reach out anytime.") and set detected_intent to "farewell".
- NEVER diagnose diseases or medical conditions under any circumstance.
- NEVER prescribe or recommend medicines.
- NEVER provide risky, diagnostic, or clinical medical advice.
- IF the patient is in danger or mentions a severe medical issue, set "is_escalation" to true immediately.
- IF they want to talk to a human agent, set "is_escalation" to true immediately.
- NEVER use HTML tags (such as <ul>, <li>, <br>) in your response. WhatsApp does not support HTML. Use newlines for spacing and hyphens (-) or asterisks (*) for bullets.

${confirmedBookingSection}
### APPOINTMENT BOOKING CONTEXT:
- You accept appointment requests 24/7 at any hour. Always proceed to collect booking details for the next available future slot.
- To book an appointment, you MUST collect:
  1. Preferred Doctor Name
  2. Preferred Date (in YYYY-MM-DD format)
  3. Preferred Time (in HH:MM format)
- Remember and extract information from the "### RECENT CONVERSATION HISTORY" section. If the patient selected a doctor, date, or time in a previous turn, preserve that selection and do not ask for it again.
- In the "booking_details" object of your JSON output, populate any doctor_name, date, or time that has been collected at any point during this conversation, even if it was not in the most recent message.
- Today is ${todayLabel}.
- Multi-Doctor Rules:
  - Check the "### DOCTORS:" section. If there is more than one doctor registered in the clinic, and a doctor has NOT been selected/mentioned yet in the conversation history:
    - You MUST ask the patient to choose/select a doctor first. Present the available doctors in exactly the engaging, short layout specified below.
    - Do NOT ask for the preferred date and time in the same message. Focus only on getting the doctor selected.
  - If there is only one doctor in the clinic, OR if a doctor has already been selected/mentioned in the conversation history, you can ask for the preferred date and time in the same message.
- When asking for the date and time, or if the patient asks for "available slots", "free slots", or "when is Dr. X available?", and a doctor has been selected/mentioned (or if there is only one doctor):
  - You MUST look up the pre-calculated available slots from the "### DYNAMICALLY CALCULATED FREE SLOTS FOR THE NEXT 7 DAYS:" section for that doctor.
  - CRITICAL: Each slot entry is formatted as "WEEKDAY MONTH DAY [YYYY-MM-DD]". You MUST use the weekday name EXACTLY as written in that label — do NOT recompute or guess the weekday from the date. The label is authoritative.
  - Present these free slots date-by-date to the patient exactly as listed, grouping them elegantly by day.
  - Do NOT list standard shift/working hours (like "Monday to Saturday: 09:00 - 17:00") when they ask for available slots.
  - Do NOT suggest any date/time slots that are not in the "### DYNAMICALLY CALCULATED FREE SLOTS FOR THE NEXT 7 DAYS:" section.
  - Do NOT state that a date is a particular weekday UNLESS that date appears in the free-slots context with that weekday label. If a date is NOT in the context, do NOT speculate about its weekday or availability.
  - Explicitly ask the patient to choose one of these available dates and times.
- If a requested date falls on a clinic holiday or doctor leave day, politely explain why it is unavailable and list alternative days.
- If a requested time does not match the doctor's active slots for that day, politely explain and present the list of active slot start times for that day.
- Do NOT fill in missing details with guesses.
- If they provide all details, extract them into the JSON output.

### ENGAGING WHATSAPP FORMATTING & CONCISENESS RULES:
- KEEP MESSAGES VERY CONCISE AND SHORT. Avoid long, wordy paragraphs, generic filler sentences, or large blocks of text. Patients read these messages on small WhatsApp mobile screens, so brevity is key.
- USE EMOJIS, BOLD TEXT (*text*), AND NEWLINES to format messages beautifully and make them highly premium and interactive.
- When listing **Available Doctors** (if more than one doctor is registered and none has been chosen yet):
  - Use exactly this clean, engaging, interactive format:

🦷 *Available Doctors* 👨‍⚕️👩‍⚕️

1️⃣ [Dr. Doctor Name] ([Specialization])
2️⃣ [Dr. Doctor Name] ([Specialization])

✅ *Please select one of them to continue with your appointment booking.*

- When listing **Available Slots / Free Slots** for a doctor:
  - Present them in exactly this engaging, clean, and highly interactive layout grouped by day:
  - The date header in the format below MUST use the weekday exactly as it appears in the "### DYNAMICALLY CALCULATED FREE SLOTS" context (e.g., if context says "WEDNESDAY May 27", write "Wednesday, May 27" — never a different weekday):

🗓️ *Available Slots for [Dr. Doctor Name]* ⏰

📍 *[Weekday from context], [Month] [Day]:*
👉 [Time 1], [Time 2], [Time 3]

📍 *[Weekday from context], [Month] [Day]:*
👉 [Time 1], [Time 2], [Time 3]

✅ *Please reply with your preferred date and time to secure your booking.*

- Keep all other responses (such as service inquiries, clinic timing details, greetings) concise and visually engaging using friendly emojis (e.g. 👋, 🩺, 📍, 📞) and bold accents to look alive and professional.

### OUTPUT FORMAT:
You MUST output a valid JSON object matching this schema. Do not output any markdown wrapping or comments outside the JSON:
{
  "detected_intent": "doctor_availability" | "clinic_timings" | "appointment_booking" | "service_inquiry" | "pricing_question" | "greeting" | "emergency" | "fallback",
  "ai_response": "Polite reply string adhering to the rules...",
  "confidence_score": 0.0 to 1.0 (float),
  "is_escalation": true/false (boolean),
  "booking_details": {
    "doctor_name": "Doctor name if selected or mentioned in the conversation",
    "date": "YYYY-MM-DD if selected or mentioned in the conversation",
    "time": "HH:MM if selected or mentioned in the conversation"
  }
}`

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log('[AI Healthcare] GEMINI_API_KEY is not configured on the server.')
    return false
  }

  async function callGemini(modelName: string, signal?: AbortSignal) {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: messageText,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                detected_intent: {
                  type: 'STRING',
                  description: 'doctor_availability, clinic_timings, appointment_booking, service_inquiry, pricing_question, greeting, emergency, or fallback',
                },
                ai_response: { type: 'STRING' },
                confidence_score: { type: 'NUMBER' },
                is_escalation: { type: 'BOOLEAN' },
                booking_details: {
                  type: 'OBJECT',
                  properties: {
                    doctor_name: { type: 'STRING', description: 'Doctor name if selected/mentioned in the conversation' },
                    date: { type: 'STRING', description: 'YYYY-MM-DD if selected/mentioned in the conversation' },
                    time: { type: 'STRING', description: 'HH:MM if selected/mentioned in the conversation' },
                  },
                },
              },
              required: ['detected_intent', 'ai_response', 'confidence_score', 'is_escalation'],
            },
          },
        }),
      }
    )
  }

  async function callOpenAI(): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server.')
    }

    const isOpenRouter = openaiKey.startsWith('sk-or-v1')
    const url = isOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions'

    const modelName = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    }

    if (isOpenRouter) {
      headers['HTTP-Referer'] = 'http://localhost:3000'
      headers['X-Title'] = 'WhatsApp CRM'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: messageText,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      const providerName = isOpenRouter ? 'OpenRouter' : 'OpenAI'
      throw new Error(`${providerName} API failed: ${response.status} ${errText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error(`No content returned from ${isOpenRouter ? 'OpenRouter' : 'OpenAI'} API`)
    }
    return content
  }

  let openAIResult: OpenAIResponse | null = null

  try {
    // ─── Step 1: Try Gemini (unless circuit breaker is open) ────────────────
    let content: string | null = null
    const circuitOpen = Date.now() < geminiCircuitOpenUntil

    if (!circuitOpen) {
      const ctrl = new AbortController()
      const timeoutId = setTimeout(() => ctrl.abort(), 8_000) // 8-second hard cap

      try {
        // Primary: gemini-2.5-flash (current stable model)
        let gemRes = await callGemini('gemini-2.5-flash', ctrl.signal)

        // Soft failure (503 service unavailable) → try gemini-2.0-flash once
        if (!gemRes.ok && gemRes.status === 503) {
          console.warn('[AI Healthcare] gemini-2.5-flash 503 — trying gemini-2.0-flash...')
          clearTimeout(timeoutId)
          const ctrl2 = new AbortController()
          const timeout2 = setTimeout(() => ctrl2.abort(), 8_000)
          try {
            gemRes = await callGemini('gemini-2.0-flash', ctrl2.signal)
          } catch {
            // network / abort on backup — fall through to OpenAI below
          } finally {
            clearTimeout(timeout2)
          }
        }

        if (gemRes.ok) {
          const resData = await gemRes.json()
          content = resData.candidates?.[0]?.content?.parts?.[0]?.text ?? null
        } else {
          // Hard failure: read the error body once, decide whether to trip the breaker
          const errBody = await gemRes.text().catch(() => '')
          const isPermanent =
            gemRes.status === 404 ||
            errBody.includes('"limit": 0') ||
            errBody.includes('"limit":0')

          if (isPermanent) {
            geminiCircuitOpenUntil = Date.now() + GEMINI_CIRCUIT_OPEN_MS
            console.warn(
              `[AI Healthcare] Gemini hard failure (${gemRes.status}) — circuit breaker open for 60 s. Switching to OpenAI.`
            )
          } else {
            console.warn(
              `[AI Healthcare] Gemini failure (${gemRes.status}) — switching to OpenAI.`
            )
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[AI Healthcare] Gemini call error (${msg}) — switching to OpenAI.`)
      } finally {
        clearTimeout(timeoutId)
      }
    } else {
      console.log('[AI Healthcare] Gemini circuit breaker active — using OpenAI directly.')
    }

    // ─── Step 2: OpenAI fallback ────────────────────────────────────────────
    if (!content) {
      console.warn('[AI Healthcare] Falling back to OpenAI gpt-4o-mini...')
      content = await callOpenAI()
    }

    // Parse JSON response
    let parsed: any = null
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.warn('[AI Healthcare] JSON parsing failed, running regex fallback parser...', err)
      // Extract from schema using Regex
      const detectedIntentMatch = content.match(/"detected_intent"\s*:\s*"([^"]*)"/)
      const aiResponseMatch = content.match(/"ai_response"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|(?:\s*\}))/)
      const confidenceScoreMatch = content.match(/"confidence_score"\s*:\s*([0-9.]+)/)
      const isEscalationMatch = content.match(/"is_escalation"\s*:\s*(true|false)/)
      
      const docNameMatch = content.match(/"doctor_name"\s*:\s*"([^"]*)"/)
      const dateMatch = content.match(/"date"\s*:\s*"([^"]*)"/)
      const timeMatch = content.match(/"time"\s*:\s*"([^"]*)"/)

      parsed = {
        detected_intent: detectedIntentMatch ? detectedIntentMatch[1] : 'fallback',
        ai_response: aiResponseMatch ? aiResponseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Could you please rephrase that?',
        confidence_score: confidenceScoreMatch ? parseFloat(confidenceScoreMatch[1]) : 0.5,
        is_escalation: isEscalationMatch ? isEscalationMatch[1] === 'true' : false,
        booking_details: {
          doctor_name: docNameMatch ? docNameMatch[1] : undefined,
          date: dateMatch ? dateMatch[1] : undefined,
          time: timeMatch ? timeMatch[1] : undefined
        }
      }
    }

    openAIResult = {
      detected_intent: parsed.detected_intent || 'fallback',
      ai_response: parsed.ai_response || 'How can I assist you?',
      confidence_score: parsed.confidence_score !== undefined ? parsed.confidence_score : 1.0,
      is_escalation: !!parsed.is_escalation,
      booking_details: parsed.booking_details || {}
    }
  } catch (error) {
    console.error('[AI Healthcare] Both Gemini and OpenAI fallback invocation error:', error)
    return false
  }

  if (!openAIResult) return false

  console.log('[AI Healthcare] Detected Intent:', openAIResult.detected_intent, 'Confidence:', openAIResult.confidence_score)

  // 6. Handle Escalation / Low Confidence
  if (openAIResult.is_escalation || openAIResult.confidence_score < 0.7 || openAIResult.detected_intent === 'emergency') {
    await handleHumanEscalation({
      db,
      clinic,
      aiSettings,
      contactId,
      conversationId,
      userMessage: messageText,
      intent: openAIResult.detected_intent || 'fallback',
      reason: openAIResult.confidence_score < 0.7 ? 'Low confidence score.' : 'LLM flagged for escalation.',
      accessToken,
      phoneNumberId,
      senderPhone,
      contextMessageId,
      customResponse: openAIResult.ai_response,
    })
    return true
  }

  // 7. Handle Appointment Booking Flow
  if (openAIResult.detected_intent === 'appointment_booking') {
    const details = openAIResult.booking_details
    if (!details || !details.doctor_name || !details.date || !details.time) {
      // Missing details: send prompt asking for them
      await sendReplyAndSave({
        db,
        clinicId: clinic.id,
        contactId,
        conversationId,
        responseText: openAIResult.ai_response,
        intent: 'appointment_booking',
        confidence: openAIResult.confidence_score,
        userMessage: messageText,
        senderPhone,
        contextMessageId,
        accessToken,
        phoneNumberId,
      })
      return true
    }

    // All details are present. Try to schedule
    const bookingOutcome = await handleSlotBooking({
      db,
      clinic,
      doctors: doctors || [],
      timings: timings || [],
      details: {
        doctor_name: details.doctor_name,
        date: details.date,
        time: details.time,
      },
      contactId,
    })

    await sendReplyAndSave({
      db,
      clinicId: clinic.id,
      contactId,
      conversationId,
      responseText: bookingOutcome.message,
      intent: 'appointment_booking',
      confidence: openAIResult.confidence_score,
      userMessage: messageText,
      senderPhone,
      contextMessageId,
      accessToken,
      phoneNumberId,
    })
    return true
  }

  // 8. General Intent Response (Greeting, Timings, Services, FAQ, Pricing, etc.)
  await sendReplyAndSave({
    db,
    clinicId: clinic.id,
    contactId,
    conversationId,
    responseText: openAIResult.ai_response,
    intent: openAIResult.detected_intent,
    confidence: openAIResult.confidence_score,
    userMessage: messageText,
    senderPhone,
    contextMessageId,
    accessToken,
    phoneNumberId,
  })

  return true
}

/**
 * Performs slot availability check and books the appointment in the database.
 */
async function handleSlotBooking(options: {
  db: any
  clinic: any
  doctors: any[]
  timings: any[]
  details: { doctor_name: string; date: string; time: string }
  contactId: string
}): Promise<{ success: boolean; message: string }> {
  const { db, clinic, doctors, timings, details, contactId } = options
  const { doctor_name, date, time } = details

  // Parse requested date to get weekday name
  const bookingDate = new Date(date)
  if (isNaN(bookingDate.getTime())) {
    return {
      success: false,
      message: `The date format "${date}" is invalid. Please specify a valid date (e.g. YYYY-MM-DD).`,
    }
  }

  // Prevent booking past dates and times
  const todayStr = getLocalDateString(new Date())
  if (date < todayStr) {
    return {
      success: false,
      message: `The requested date "${date}" has already passed. Please choose a future date.`,
    }
  }

  if (date === todayStr) {
    const [reqHour, reqMin] = time.split(':').map(Number)
    const reqVal = reqHour * 100 + reqMin
    
    const nowObj = new Date()
    const nowVal = nowObj.getHours() * 100 + nowObj.getMinutes()
    if (reqVal <= nowVal) {
      return {
        success: false,
        message: `The requested time "${time}" has already passed for today. Please select a future slot.`,
      }
    }
  }

  const weekday = bookingDate.toLocaleDateString('en-US', { weekday: 'long' })

  // Find matching doctor using robust cleaning logic
  const cleanReqName = cleanDoctorName(doctor_name)
  const matchedDoc = doctors.find((d) => {
    const cleanDbName = cleanDoctorName(d.doctor_name)
    return cleanDbName.includes(cleanReqName) || cleanReqName.includes(cleanDbName)
  })

  if (!matchedDoc) {
    const list = doctors
      .map((d, index) => `${index + 1}️⃣ ${formatDocName(d.doctor_name)}${d.specialization ? ` (${d.specialization})` : ''}`)
      .join('\n')
    return {
      success: false,
      message: `We couldn't find a doctor matching "*${doctor_name}*".\n\n🦷 *Available Doctors* 👨‍⚕️👩‍⚕️\n\n${list || 'None'}\n\n✅ *Please select one of them to continue with your appointment booking.*`,
    }
  }

  // 1. Check clinic exceptions (holidays)
  const clinicEx = (clinic.date_exceptions || []).find((e: any) => e.date === date);
  if (clinicEx) {
    if (clinicEx.is_closed) {
      return {
        success: false,
        message: `The clinic is closed on ${date}${clinicEx.reason ? ` due to ${clinicEx.reason}` : ''}. Please choose another date.`,
      };
    }
  }

  // 2. Check doctor exceptions (leaves / unavailable days)
  const docEx = (matchedDoc.date_exceptions || []).find((e: any) => e.date === date);
  if (docEx) {
    if (!docEx.is_available) {
      return {
        success: false,
        message: `${formatDocName(matchedDoc.doctor_name)} is unavailable/on leave on ${date}${docEx.reason ? ` (${docEx.reason})` : ''}. Please choose a different date.`,
      };
    }
  }

  // 3. Check clinic timings for that weekday (only if no specific clinic date exception overrides it)
  if (!clinicEx) {
    const clinicTiming = timings.find(
      (t) => t.day_name.toLowerCase() === weekday.toLowerCase()
    )
    if (!clinicTiming || clinicTiming.is_closed) {
      return {
        success: false,
        message: `The clinic is closed on ${weekday}s. Please choose a different day.`,
      }
    }

    // Check lunch break
    const reqTimeVal = time.replace(':', '')
    if (clinicTiming.lunch_break_start && clinicTiming.lunch_break_end) {
      const lunchStart = clinicTiming.lunch_break_start.replace(':', '')
      const lunchEnd = clinicTiming.lunch_break_end.replace(':', '')
      if (reqTimeVal >= lunchStart && reqTimeVal < lunchEnd) {
        return {
          success: false,
          message: `The requested time ${time} falls during the clinic's lunch break (${clinicTiming.lunch_break_start} - ${clinicTiming.lunch_break_end}). Please choose another time.`,
        }
      }
    }
  }

  // 4. Check doctor's availability days (only if no doctor schedule exception overrides it)
  if (!docEx) {
    const isAvailableDay = matchedDoc.available_days?.some(
      (d: string) => d.toLowerCase() === weekday.toLowerCase()
    )
    if (!isAvailableDay) {
      const daysList = matchedDoc.available_days?.join(', ') || 'None'
      return {
        success: false,
        message: `${formatDocName(matchedDoc.doctor_name)} is not available on ${weekday}s. Their working days are: ${daysList}.`,
      }
    }
  }

  // 5. Check slots if configured, otherwise fall back to start/end hours
  let activeSlots: any[] = [];
  if (docEx && docEx.slots && docEx.slots.length > 0) {
    activeSlots = docEx.slots.filter((s: any) => s.is_active);
  } else if (matchedDoc.weekly_slots && matchedDoc.weekly_slots[weekday]) {
    activeSlots = matchedDoc.weekly_slots[weekday].filter((s: any) => s.is_active);
  }

  if (activeSlots.length > 0) {
    // Check if the requested time matches one of the slot start times
    const matchedSlot = activeSlots.find(
      (s: any) => s.start_time === time || s.start_time === time.substring(0, 5)
    );
    if (!matchedSlot) {
      const slotList = activeSlots.map((s: any) => s.start_time).join(', ');
      return {
        success: false,
        message: `${formatDocName(matchedDoc.doctor_name)} is only available for these slots on ${date}: ${slotList}. Please select one of these times.`,
      };
    }
  } else {
    // Fallback: Check doctor's standard shift hours
    const reqTimeVal = time.replace(':', '')
    const docStartVal = (matchedDoc.available_start_time || '09:00').replace(':', '')
    const docEndVal = (matchedDoc.available_end_time || '17:00').replace(':', '')

    if (reqTimeVal < docStartVal || reqTimeVal > docEndVal) {
      return {
        success: false,
        message: `${formatDocName(matchedDoc.doctor_name)} is only available between ${matchedDoc.available_start_time} and ${matchedDoc.available_end_time}. Please select another time slot.`,
      }
    }
  }

  // 6. Check for double booking
  const { data: existingAppts } = await db
    .from('appointments')
    .select('id')
    .eq('doctor_id', matchedDoc.id)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .neq('status', 'cancelled')

  if (existingAppts && existingAppts.length > 0) {
    return {
      success: false,
      message: `${formatDocName(matchedDoc.doctor_name)} is already booked on ${date} at ${time}. Please try a different slot.`,
    }
  }

  // 5. Book the appointment
  const { error: insertError } = await db.from('appointments').insert({
    clinic_id: clinic.id,
    contact_id: contactId,
    doctor_id: matchedDoc.id,
    appointment_date: date,
    appointment_time: time,
    status: 'scheduled',
  })

  if (insertError) {
    console.error('[AI Healthcare] Appointment booking insert failed:', insertError)
    return {
      success: false,
      message: 'An internal error occurred while reserving your slot. Please try again shortly.',
    }
  }

  return {
    success: true,
    message: `Your appointment with ${formatDocName(matchedDoc.doctor_name)} has been successfully booked for ${date} at ${time}! We look forward to seeing you.`,
  }
}

/**
 * Utility to escalate a chat to a human agent, disable bot response, and save a contact note.
 */
async function handleHumanEscalation(options: {
  db: any
  clinic: any
  aiSettings: any
  contactId: string
  conversationId: string
  userMessage: string
  intent: string
  reason: string
  accessToken: string
  phoneNumberId: string
  senderPhone: string
  contextMessageId?: string
  customResponse?: string
}) {
  const {
    db,
    clinic,
    aiSettings,
    contactId,
    conversationId,
    userMessage,
    intent,
    reason,
    accessToken,
    phoneNumberId,
    senderPhone,
    contextMessageId,
    customResponse,
  } = options

  console.log(`[AI Healthcare] Escalating conversation ${conversationId} to human. Reason: ${reason}`)

  // 1. Send transfer message to patient.
  // NOTE: after_hours_message is intentionally NOT used here — it typically
  // contains "clinic is closed" language which is wrong for a human handover.
  const transferMessage =
    customResponse ||
    'I am connecting you to a team member who will assist you shortly. Please hold on! 🙏'

  // 2. Add CRM notification in contact notes
  const noteText = `[AI Healthcare Escalation]\nPatient requested human assistance or emergency detected.\n- Detected Intent: ${intent}\n- Reason: ${reason}\n- Patient Query: "${userMessage}"`

  // Insert Note
  // We use the clinic's user_id as the author of the note
  const { error: noteError } = await db.from('contact_notes').insert({
    contact_id: contactId,
    user_id: clinic.user_id,
    note_text: noteText,
  })
  if (noteError) console.error('[AI Healthcare] Escalation note insert failed:', noteError)

  // 3. Mark conversation status as open so agents see it
  const { error: convUpdateError } = await db
    .from('conversations')
    .update({
      status: 'open',
      unread_count: 1, // Highlight in inbox
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (convUpdateError) console.error('[AI Healthcare] Escalation conversation status update failed:', convUpdateError)

  // 4. Send WhatsApp message and log
  await sendReplyAndSave({
    db,
    clinicId: clinic.id,
    contactId,
    conversationId,
    responseText: transferMessage,
    intent: intent,
    confidence: 1.0,
    userMessage,
    senderPhone,
    contextMessageId,
    accessToken,
    phoneNumberId,
  })
}

/**
 * Helper to send a WhatsApp reply, save the bot message to CRM messages, and record a log in ai_chat_logs.
 */
async function sendReplyAndSave(options: {
  db: any
  clinicId: string
  contactId: string
  conversationId: string
  responseText: string
  intent: string
  confidence: number
  userMessage: string
  senderPhone: string
  contextMessageId?: string
  accessToken: string
  phoneNumberId: string
}) {
  const {
    db,
    clinicId,
    contactId,
    conversationId,
    responseText,
    intent,
    confidence,
    userMessage,
    senderPhone,
    contextMessageId,
    accessToken,
    phoneNumberId,
  } = options

  // Send WhatsApp message
  let sentMessageId: string | undefined = undefined
  try {
    const result = await sendTextMessage({
      phoneNumberId,
      accessToken,
      to: senderPhone,
      text: responseText,
      contextMessageId, // Replied-to quote preview
    })
    sentMessageId = result.messageId
  } catch (error: any) {
    console.error('[AI Healthcare] Failed to send WhatsApp message via Meta Cloud API:', error.message || error)
  }

  // Insert Bot message to CRM messages table so it displays in shared inbox
  const { error: msgInsertError } = await db.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'bot',
    content_type: 'text',
    content_text: responseText,
    message_id: sentMessageId || `bot-fallback-${Date.now()}`,
    status: (sentMessageId || process.env.NODE_ENV === 'development') ? 'sent' : 'failed',
    created_at: new Date().toISOString(),
  })
  if (msgInsertError) console.error('[AI Healthcare] Bot message CRM insert failed:', msgInsertError)

  // Update CRM Conversation last message stats
  const { error: convUpdateError } = await db
    .from('conversations')
    .update({
      last_message_text: responseText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
  if (convUpdateError) console.error('[AI Healthcare] Conversation CRM update failed:', convUpdateError)

  // Insert into AI chat logs for auditing and analytics
  const { error: logError } = await db.from('ai_chat_logs').insert({
    clinic_id: clinicId,
    patient_id: contactId,
    user_message: userMessage,
    ai_response: responseText,
    detected_intent: intent,
    confidence_score: confidence,
    created_at: new Date().toISOString(),
  })
  if (logError) console.error('[AI Healthcare] AI chat log insert failed:', logError)
}
