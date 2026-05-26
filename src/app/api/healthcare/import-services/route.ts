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
Your task is to analyze raw unstructured text (which may be copied from Excel, Word, PDF, or text files) representing clinic treatment services and extract a clean list of services.

For each service, you MUST extract:
1. "service_name" (string, name of treatment)
2. "description" (string, short description of the treatment/service. Keep descriptions extremely short and concise under 80 characters. If none present, write a brief explanation or keep it empty)
3. "starting_price" (number, base cost in dollars. Default to 0 if not found)
4. "duration" (number, duration in minutes. Default to 30 if not found)

IMPORTANT: Limit the extraction to a maximum of 40 services. If the input has more, only process the first 40 to avoid output truncation.

Output MUST be a valid JSON object matching this schema.
{
  "services": [
    {
      "service_name": "Teeth Whitening",
      "description": "Professional dental cosmetic whitening session",
      "starting_price": 120.00,
      "duration": 45
    }
  ]
}

If the text contains no recognizable services, return an empty array for the "services" key.`

  const textToAnalyze = body.text
  console.log('[AI Services Importer] Starting analysis request...');
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn('[AI Services Importer] Request timed out after 15 seconds. Aborting.')
    controller.abort()
  }, 15000)

  async function callGemini(modelName: string, text: string) {
    console.log(`[AI Services Importer] Querying ${modelName} endpoint...`)
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
                services: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      service_name: { type: 'STRING' },
                      description: { type: 'STRING' },
                      starting_price: { type: 'NUMBER' },
                      duration: { type: 'INTEGER' },
                    },
                    required: ['service_name'],
                  },
                },
              },
              required: ['services'],
            },
          },
        }),
      }
    )
  }

  try {
    let response = await callGemini('gemini-2.5-flash', textToAnalyze)

    // If 2.5-flash is unavailable (503) or rate-limited (429), try 2.0-flash
    if (!response.ok && (response.status === 503 || response.status === 429)) {
      console.warn(`[AI Services Importer] Model gemini-2.5-flash returned ${response.status}. Falling back to gemini-2.0-flash...`)
      response = await callGemini('gemini-2.0-flash', textToAnalyze)
    }

    clearTimeout(timeoutId)
    console.log('[AI Services Importer] Received response from Gemini. Status:', response.status)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API failed: ${response.status} ${errText}`)
    }

    const resData = await response.json()
    const content = resData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('No content returned from Gemini API')
    }

    let servicesList: any[] = []
    try {
      const parsed = JSON.parse(content)
      servicesList = parsed.services ?? []
      console.log('[AI Services Importer] Successfully parsed JSON content. Count:', servicesList.length)
    } catch (parseErr) {
      console.warn('[AI Services Importer] JSON parsing failed, running regex fallback parser...', parseErr)
      // Extract valid flat service objects using regex
      const objectRegex = /\{\s*"service_name"\s*:\s*"[^"]*"[\s\S]*?\}/g
      const matches = content.match(objectRegex)
      if (matches) {
        for (const match of matches) {
          try {
            const obj = JSON.parse(match)
            if (obj && obj.service_name) {
              servicesList.push({
                service_name: obj.service_name,
                description: obj.description || '',
                starting_price: Number(obj.starting_price) || 0,
                duration: Number(obj.duration) || 30
              })
            }
          } catch (e) {
            // Ignore malformed object slices
          }
        }
      }
      console.log('[AI Services Importer] Fallback parser recovered services count:', servicesList.length)
      if (servicesList.length === 0) {
        throw new Error('Failed to parse any valid services from the AI response.')
      }
    }

    return NextResponse.json({ services: servicesList })
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('[AI Services Importer] Error parsing text:', error)
    const errorMsg = error.name === 'AbortError' 
      ? 'Connection timed out. Please check your network connection or API key validity.'
      : (error.message || 'Internal server error during analysis');
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
