// Usa Claude API para interpretar texto de voz y extraer campos estructurados
// Sin importar el idioma, formato o mezcla

export async function parseVoiceWithAI(text) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Extract job quote information from this voice input (may be in English, Spanish, or mixed). Return ONLY valid JSON, no other text.

Voice input: "${text}"

Extract:
- job_description: what the work is (string, required)
- client_name: client's name if mentioned (string or null)
- client_address: street address if mentioned (string or null)  
- client_phone: phone number if mentioned (string or null)
- prices: array of up to 3 numbers representing price options (numbers only, ignore street numbers)

Rules:
- For prices: look for numbers that represent money amounts ($50-$50000). Ignore house/street numbers.
- If prices mentioned as words like "doscientos" = 200, "cuatro cincuenta" = 450, "siento" = 100 (but likely "ciento" = 100)
- Return null for fields not found
- Return empty array [] if no prices found

Example response:
{"job_description":"AC repair","client_name":"John Davis","client_address":"412 Main St","client_phone":null,"prices":[180,450,750]}`
        }]
      })
    })

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    
    // Parsear el JSON de respuesta
    const clean = content.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('AI parse error:', e)
    return null
  }
}
