// Whisper de OpenAI — mejor reconocimiento de voz del mercado
// Funciona en cualquier celular, cualquier idioma, cualquier acento

export async function transcribeAudio(audioBlob, language = 'es') {
  const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
  if (!OPENAI_KEY) throw new Error('OpenAI key not configured')

  const formData = new FormData()
  formData.append('file', audioBlob, 'voice.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', language) // 'es' o 'en'
  formData.append('response_format', 'text')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: formData
  })

  if (!response.ok) throw new Error(`Whisper error: ${response.status}`)
  return await response.text() // texto transcrito limpio
}

export function startRecording(onStop) {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        onStop(blob)
      }

      recorder.start()
      resolve(recorder)
    } catch (e) {
      reject(e)
    }
  })
}
