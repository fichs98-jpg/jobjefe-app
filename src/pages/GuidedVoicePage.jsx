import { useState, useRef } from 'react'
import { transcribeAudio, startRecording } from '../lib/whisper'
import { parseVoiceWithAI } from '../lib/voiceAI'
import { useStore } from '../store/useStore'

const STEPS = [
  { id: 'client',  question: "What's the client's name?",         placeholder: "e.g. John Davis",           field: 'client'  },
  { id: 'address', question: "What's the job address?",           placeholder: "e.g. 412 Oak St, Houston",  field: 'address' },
  { id: 'job',     question: "What's the job?",                   placeholder: "e.g. Water heater repair",  field: 'desc'    },
  { id: 'phone',   question: "Client's phone number? (optional)", placeholder: "e.g. +1 713 555 0192",      field: 'phone'   },
  { id: 'prices',  question: "Set prices or let AI estimate?",    placeholder: null,                        field: 'prices'  },
]

export default function GuidedVoicePage({ onDone, onCancel }) {
  const { showToast } = useStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ client: '', address: '', desc: '', phone: '', prices: 'ai' })
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lang, setLang] = useState('en')
  const recRef = useRef(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = Math.round(((step) / STEPS.length) * 100)

  async function recordAnswer() {
    if (listening) {
      try { recRef.current?.stop() } catch(e) {}
      return
    }
    setListening(true)
    try {
      const recorder = await startRecording(async (blob) => {
        setListening(false)
        setProcessing(true)
        try {
          const text = await transcribeAudio(blob, lang)
          if (text?.trim()) {
            setAnswers(prev => ({ ...prev, [current.field]: text.trim() }))
            showToast('✓ Got it!', 'success')
          }
        } catch(e) {
          showToast('Could not hear. Type it instead.', 'error')
        } finally {
          setProcessing(false)
        }
      })
      recRef.current = recorder
      setTimeout(() => { try { recorder.stop() } catch(e) {} }, 15000)
    } catch(e) {
      setListening(false)
      showToast('Mic error. Type it instead.', 'error')
    }
  }

  async function finish() {
    setProcessing(true)
    try {
      let result
      if (answers.prices === 'ai') {
        // Dejar que la IA estime los precios basado en el trabajo
        const voiceText = `Job: ${answers.desc}. Client: ${answers.client}. Address: ${answers.address}.`
        result = await parseVoiceWithAI(voiceText)
      }
      onDone({
        desc: answers.desc,
        client: answers.client,
        address: answers.address,
        phone: answers.phone,
        aiResult: result,
      })
    } catch(e) {
      showToast('Error. Try again.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  function next() {
    if (!answers[current.field] && current.id !== 'phone') {
      showToast('Please answer this step first', 'error')
      return
    }
    if (isLast) { finish(); return }
    setStep(s => s + 1)
  }

  function skip() { setStep(s => s + 1) }

  return (
    <div className="fixed inset-0 bg-jefe z-50 flex flex-col">

      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} className="text-white/60 text-sm">✕ Cancel</button>
          <div className="flex gap-1">
            {['en','es'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all
                  ${lang === l ? 'bg-naranja text-white' : 'bg-white/10 text-white/60'}`}>
                {l === 'en' ? '🇺🇸' : '🇲🇽'}
              </button>
            ))}
          </div>
          <span className="text-white/60 text-sm">{step + 1} / {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-naranja rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Procesando */}
        {processing && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-white/20 border-t-naranja rounded-full animate-spin"/>
            <p className="text-white/80 text-sm">Processing…</p>
          </div>
        )}

        {!processing && current.id !== 'prices' && (
          <>
            <div className="text-center">
              <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                Step {step + 1}
              </div>
              <h2 className="text-white text-2xl font-bold leading-tight mb-2">
                {current.question}
              </h2>
              {answers[current.field] ? (
                <div className="bg-white/10 rounded-xl px-4 py-3 mt-2">
                  <p className="text-naranja font-semibold">✓ {answers[current.field]}</p>
                </div>
              ) : null}
            </div>

            {/* Botón de voz */}
            <button onClick={recordAnswer}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95
                ${listening ? 'bg-rojo animate-pulse' : 'bg-naranja shadow-lg shadow-naranja/30'}`}>
              <span className="text-4xl">{listening ? '⏹' : '🎤'}</span>
            </button>
            <p className="text-white/50 text-xs text-center">
              {listening ? 'Tap to stop recording' : 'Tap to speak'}
            </p>

            {/* Input manual como alternativa */}
            <div className="w-full">
              <p className="text-white/40 text-xs text-center mb-2">— or type it —</p>
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-naranja"
                placeholder={current.placeholder}
                value={answers[current.field]}
                onChange={e => setAnswers(prev => ({ ...prev, [current.field]: e.target.value }))}
              />
            </div>
          </>
        )}

        {/* Paso especial: precios */}
        {!processing && current.id === 'prices' && (
          <>
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold leading-tight mb-2">
                How do you want to set prices?
              </h2>
              <p className="text-white/60 text-sm">AI uses US market rates for {answers.desc}</p>
            </div>
            <div className="w-full space-y-3">
              {[
                { val: 'ai', icon: '🤖', title: 'AI estimates for me', sub: 'Based on US market rates for this job' },
                { val: 'voice', icon: '🎤', title: "I'll say the 3 prices", sub: 'Speak: basic, recommended, premium' },
              ].map(opt => (
                <button key={opt.val} onClick={() => setAnswers(prev => ({ ...prev, prices: opt.val }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                    ${answers.prices === opt.val ? 'border-naranja bg-naranja/10' : 'border-white/20 bg-white/5'}`}>
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <div className={`font-bold text-sm ${answers.prices === opt.val ? 'text-naranja' : 'text-white'}`}>
                      {opt.title}
                    </div>
                    <div className="text-white/50 text-xs mt-0.5">{opt.sub}</div>
                  </div>
                  {answers.prices === opt.val && <span className="ml-auto text-naranja text-lg">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Botones de acción */}
      {!processing && (
        <div className="px-5 pb-safe pb-8 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border-2 border-white/20 text-white/70 font-bold text-sm active:scale-95 transition-all">
              ← Back
            </button>
          )}
          {current.id === 'phone' && (
            <button onClick={skip}
              className="flex-1 py-3 rounded-xl border-2 border-white/20 text-white/60 font-bold text-sm active:scale-95 transition-all">
              Skip
            </button>
          )}
          <button onClick={next}
            className="flex-2 flex-1 py-3 rounded-xl bg-naranja text-white font-bold text-sm active:scale-95 transition-all">
            {isLast ? '🚀 Build my quote' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
