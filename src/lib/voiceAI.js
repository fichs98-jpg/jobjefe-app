// Motor de IA de JobJefe — GPT-4o-mini con response_format json_object
// Extrae datos de voz y estima precios de mercado EE.UU. si no se mencionan

const SYSTEM_PROMPT = `Eres el motor de Inteligencia Artificial de JobJefe, un software de cotizaciones rápidas para técnicos en campo (plomeros, electricistas, cerrajeros, HVAC).
Tu tarea es procesar una transcripción de voz dictada por un técnico tras hablar con un cliente, extraer los datos clave y estructurarlos estrictamente en tres opciones de servicio (Básica, Recomendada y Premium).

Sigue estas reglas estrictas:
1. Extrae el nombre del cliente y la dirección si se mencionan. Si no se mencionan, pon null.
2. Identifica los trabajos o soluciones mencionadas y clasifícalos de menor a mayor complejidad/costo en los tres niveles.
3. Si el técnico menciona explícitamente precios para las opciones, usa esos precios. Si no menciona precios, calcula un precio estimado de mercado estándar en dólares para el mercado de EE.UU. basándote en la descripción del trabajo.
4. Mantén las descripciones breves, técnicas y orientadas a la venta (máximo 10 palabras por descripción).
5. Devuelve la información ÚNICAMENTE en el formato JSON estructurado que se te solicita, sin texto adicional ni bloques de código markdown.

Formato JSON requerido:
{
  "cliente": "Nombre o null",
  "direccion": "Dirección o null",
  "descripcion_trabajo": "Resumen breve del trabajo en 5 palabras máximo",
  "cotizacion": {
    "basica": {
      "titulo": "Título corto de la solución más simple",
      "descripcion": "Detalle breve del trabajo básico",
      "precio": 0
    },
    "recomendada": {
      "titulo": "Título corto de la mejor solución costo-beneficio",
      "descripcion": "Detalle breve del trabajo recomendado",
      "precio": 0
    },
    "premium": {
      "titulo": "Título corto de la solución de máxima calidad",
      "descripcion": "Detalle breve del trabajo premium con garantías o extras",
      "precio": 0
    }
  }
}`

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
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ]
      })
    })

    const data = await response.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')

    // Normalizar al formato que espera la app
    return {
      job_description: parsed.descripcion_trabajo || null,
      client_name: parsed.cliente || null,
      client_address: parsed.direccion || null,
      client_phone: null,
      prices: [
        parsed.cotizacion?.basica?.precio,
        parsed.cotizacion?.recomendada?.precio,
        parsed.cotizacion?.premium?.precio,
      ].filter(p => p != null && p > 0),
      options: [
        {
          label: parsed.cotizacion?.basica?.titulo || 'Basic',
          description: parsed.cotizacion?.basica?.descripcion || '',
          amount: parsed.cotizacion?.basica?.precio || 0,
        },
        {
          label: parsed.cotizacion?.recomendada?.titulo || 'Recommended',
          description: parsed.cotizacion?.recomendada?.descripcion || '',
          amount: parsed.cotizacion?.recomendada?.precio || 0,
        },
        {
          label: parsed.cotizacion?.premium?.titulo || 'Premium',
          description: parsed.cotizacion?.premium?.descripcion || '',
          amount: parsed.cotizacion?.premium?.precio || 0,
        },
      ]
    }
  } catch (e) {
    console.error('AI parse error:', e)
    return null
  }
}
