import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB

const SYSTEM_PROMPT = `You are an expert data parsing assistant for a medical clinic.
Your task is to analyze the provided content (from a PDF, Word document, Excel spreadsheet, or text file) and extract a clean list of FAQ question-answer pairs with trigger keywords.

For each FAQ extract:
1. "question" - the patient's question
2. "answer" - the clinic's response (clear, concise, under 200 characters)
3. "keywords" - comma-separated list of 3-5 trigger keywords

Limit output to 50 FAQs maximum.

Output MUST be valid JSON exactly matching this schema:
{
  "faqs": [
    {
      "question": "What is the consultation fee?",
      "answer": "The standard consultation fee is ₹500.",
      "keywords": "fee, price, consultation, cost, payment"
    }
  ]
}

If no recognizable Q&A pairs are found, return { "faqs": [] }`

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 as const, body: { error: 'Unauthorized' } }
  return { ok: true as const, userId: user.id }
}

function buildGeminiBody(parts: object[]) {
  return JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          faqs: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                question: { type: 'STRING' },
                answer: { type: 'STRING' },
                keywords: { type: 'STRING' },
              },
              required: ['question', 'answer'],
            },
          },
        },
        required: ['faqs'],
      },
    },
  })
}

async function callGemini(apiKey: string, body: string, signal: AbortSignal, model = 'gemini-2.5-flash') {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body }
  )
}

async function parseGeminiResponse(res: Response): Promise<{ question: string; answer: string; keywords: string }[]> {
  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('No content returned from Gemini')

  try {
    const parsed = JSON.parse(content)
    return (parsed.faqs ?? []).filter((f: any) => f?.question && f?.answer)
  } catch {
    const matches = content.match(/\{\s*"question"\s*:\s*"[^"]*"[\s\S]*?\}/g) ?? []
    const faqs: { question: string; answer: string; keywords: string }[] = []
    for (const m of matches) {
      try {
        const obj = JSON.parse(m)
        if (obj?.question && obj?.answer)
          faqs.push({ question: obj.question, answer: obj.answer, keywords: obj.keywords ?? '' })
      } catch { /* skip malformed */ }
    }
    if (faqs.length === 0) throw new Error('Failed to extract FAQs from AI response')
    return faqs
  }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Gemini API key not configured on the server' }, { status: 500 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !file.name) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: 'The uploaded file is empty' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json({ error: `File exceeds the 8 MB limit (uploaded: ${(file.size / 1024 / 1024).toFixed(1)} MB)` }, { status: 400 })

  const name = file.name.toLowerCase()
  const mime = file.type

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

  try {
    let geminiBody: string

    if (name.endsWith('.pdf') || mime === 'application/pdf') {
      // Send PDF inline — Gemini natively understands PDF structure
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      geminiBody = buildGeminiBody([
        { inlineData: { mimeType: 'application/pdf', data: base64 } },
        { text: `${SYSTEM_PROMPT}\n\nExtract all FAQ question-answer pairs from this document.` },
      ])
    } else if (
      name.endsWith('.docx') ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const { value: text } = await mammoth.extractRawText({ buffer })
      if (!text.trim()) return NextResponse.json({ error: 'Could not extract text from Word document' }, { status: 400 })
      geminiBody = buildGeminiBody([{ text: `${SYSTEM_PROMPT}\n\n---\n${text}` }])
    } else if (
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel'
    ) {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'buffer' })
      let text = ''
      for (const sheetName of wb.SheetNames) {
        text += `[Sheet: ${sheetName}]\n${XLSX.utils.sheet_to_csv(wb.Sheets[sheetName])}\n\n`
      }
      if (!text.trim()) return NextResponse.json({ error: 'Could not extract data from spreadsheet' }, { status: 400 })
      geminiBody = buildGeminiBody([{ text: `${SYSTEM_PROMPT}\n\n---\n${text}` }])
    } else if (name.endsWith('.txt') || name.endsWith('.csv') || mime.startsWith('text/')) {
      const text = await file.text()
      if (!text.trim()) return NextResponse.json({ error: 'File is empty' }, { status: 400 })
      geminiBody = buildGeminiBody([{ text: `${SYSTEM_PROMPT}\n\n---\n${text}` }])
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, Word (.docx), Excel (.xlsx / .xls), or plain text (.txt / .csv).' },
        { status: 400 }
      )
    }

    let response = await callGemini(apiKey, geminiBody, controller.signal, 'gemini-2.5-flash')

    if (!response.ok && (response.status === 503 || response.status === 429)) {
      console.warn('[FAQ Upload] gemini-2.5-flash unavailable, falling back to gemini-2.0-flash')
      response = await callGemini(apiKey, geminiBody, controller.signal, 'gemini-2.0-flash')
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`)
    }

    const faqs = await parseGeminiResponse(response)
    return NextResponse.json({ faqs, fileName: file.name })
  } catch (err: any) {
    clearTimeout(timeoutId)
    console.error('[FAQ Upload] Error:', err)
    const msg =
      err.name === 'AbortError'
        ? 'Request timed out. Please try a smaller file or check your network connection.'
        : err.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
