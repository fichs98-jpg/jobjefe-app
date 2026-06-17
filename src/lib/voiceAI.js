// Usa GPT-4o-mini de OpenAI para interpretar texto de voz y extraer campos
// Sin importar el idioma, formato o mezcla

export async function parseVoiceWithAI(text) {
  const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
  if (!OPENAI_KEY) { console.error('No OpenAI key'); return null }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [{
          role: 'system',
          content: 'You extract job quote info from voice input. Return ONLY valid JSON, no other text, no markdown.'
        }, {
          role: 'user',
          content: `Extract from this voice input (may be English, Spanish, or mixed):
"${text}"

Return JSON with these fields:
- job_description: what the work is (string, required)
- client_name: client name (string or null)
- client_address: street address (string or null)
- client_phone: phone number (string or null)
- prices: array of up to 3 price numbers between 50-50000 (ignore house numbers like 412)

Example: {"job_description":"pipe repair","client_name":"Pedro García","client_address":"412 Main Street","client_phone":null,"prices":[200,400,700]}`
        }]
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const clean = content.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('AI parse error:', e)
    return null
  }
}
