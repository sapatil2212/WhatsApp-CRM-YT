import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } }
  }
  return { ok: true, userId: user.id }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  const body = (await request.json().catch(() => null)) as { text?: string } | null
  if (!body || !body.text?.trim()) {
    return NextResponse.json({ error: 'Text to analyze is required' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key is not configured on the server' }, { status: 500 })
  }

  const systemPrompt = `You are an expert data parsing assistant.
Your task is to analyze raw unstructured text (which may be copied from Excel, Word, PDF, or text files) representing clinic FAQs (Frequently Asked Questions) and extract a clean list of questions, answers, and trigger keywords.

For each FAQ, you MUST extract:
1. "question" (string, the patient's question)
2. "answer" (string, the clinic's response)
3. "keywords" (string, a comma-separated list of 3-5 trigger keywords that relate to the question)

IMPORTANT: Limit the extraction to a maximum of 30 FAQs. If the input has more, only process the first 30 to avoid output truncation. Keep answers clear, concise, and under 150 characters.

Output MUST be a valid JSON object matching this schema.
{
  "faqs": [
    {
      "question": "What is the consultation fee?",
      "answer": "The standard consultation fee is ₹50.",
      "keywords": "fee, price, consultation, cost, payment"
    }
  ]
}

If the text contains no recognizable questions and answers, return an empty array for the "faqs" key.`

  const textToAnalyze = body.text
  console.log('[AI FAQs Importer] Starting analysis request...');
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn('[AI FAQs Importer] Request timed out after 15 seconds. Aborting.')
    controller.abort()
  }, 15000)

  async function callGemini(modelName: string, text: string) {
    console.log(`[AI FAQs Importer] Querying ${modelName} endpoint...`)
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
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
                  text: text,
                },
              ],
            },
          ],
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
        }),
      }
    )
  }

  try {
    let response = await callGemini('gemini-2.5-flash', textToAnalyze)

    // Fallback to 2.0-flash if 2.5 is unavailable or rate-limited
    if (!response.ok && (response.status === 503 || response.status === 429)) {
      console.warn(`[AI FAQs Importer] Model gemini-2.5-flash returned ${response.status}. Falling back to gemini-2.0-flash...`)
      response = await callGemini('gemini-2.0-flash', textToAnalyze)
    }

    clearTimeout(timeoutId)
    console.log('[AI FAQs Importer] Received response from Gemini. Status:', response.status)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API failed: ${response.status} ${errText}`)
    }

    const resData = await response.json()
    const content = resData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('No content returned from Gemini API')
    }

    let faqsList: any[] = []
    try {
      const parsed = JSON.parse(content)
      faqsList = parsed.faqs ?? []
      console.log('[AI FAQs Importer] Successfully parsed JSON content. Count:', faqsList.length)
    } catch (parseErr) {
      console.warn('[AI FAQs Importer] JSON parsing failed, running regex fallback parser...', parseErr)
      // Extract valid flat FAQ objects using regex matching
      const objectRegex = /\{\s*"question"\s*:\s*"[^"]*"[\s\S]*?\}/g
      const matches = content.match(objectRegex)
      if (matches) {
        for (const match of matches) {
          try {
            const obj = JSON.parse(match)
            if (obj && obj.question && obj.answer) {
              faqsList.push({
                question: obj.question,
                answer: obj.answer,
                keywords: obj.keywords || ''
              })
            }
          } catch (e) {
            // Ignore malformed object slices
          }
        }
      }
      console.log('[AI FAQs Importer] Fallback parser recovered FAQs count:', faqsList.length)
      if (faqsList.length === 0) {
        throw new Error('Failed to parse any valid FAQs from the AI response.')
      }
    }

    return NextResponse.json({ faqs: faqsList })
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('[AI FAQs Importer] Error parsing text:', error)
    const errorMsg = error.name === 'AbortError' 
      ? 'Connection timed out. Please check your network connection or API key validity.'
      : (error.message || 'Internal server error during analysis');
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
