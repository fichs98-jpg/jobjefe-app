import { useState, useRef } from 'react'
import { useJobs } from '../hooks/useJobs'
import { useStore } from '../store/useStore'
import { transcribeAudio, startRecording } from '../lib/whisper'
import GuidedVoicePage from './GuidedVoicePage'
import { parseVoiceWithAI } from '../lib/voiceAI'

const TEMPLATES = {
  hvac: [
    { label: 'Basic', description: 'Diagnostic + minor repair', amount: 180 },
    { label: 'Standard', description: 'Full repair + parts', amount: 450 },
    { label: 'Premium', description: 'Full replacement + warranty', amount: 1200 },
  ],
  plumbing: [
    { label: 'Basic', description: 'Minor fix + labor', amount: 150 },
    { label: 'Standard', description: 'Repair + parts included', amount: 380 },
    { label: 'Premium', description: 'Full replacement + permit', amount: 950 },
  ],
  electrical: [
    { label: 'Basic', description: 'Repair existing + labor', amount: 280 },
    { label: 'Standard', description: 'Panel upgrade + permit', amount: 1450 },
    { label: 'Premium', description: '200A panel + whole-house surge', amount: 2300 },
  ],
  locksmith: [
    { label: 'Basic', description: 'Unlock + basic rekey', amount: 95 },
    { label: 'Standard', description: 'Lock replacement + rekey', amount: 180 },
    { label: 'Premium', description: 'Smart lock + full rekey', amount: 350 },
  ],
}

const BASE_URL = 'https://jobjefe.com'

export default function NewJobPage({ onSuccess }) {
  const { saveJob } = useJobs()
  const { showToast } = useStore()
  const [desc, setDesc] = useState('')
  const [client, setClient] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recIdx, setRecIdx] = useState(1)
  const [opts, setOpts] = useState([
    { label: '', description: '', amount: '' },
    { label: '', description: '', amount: '' },
    { label: '', description: '', amount: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-US')
  const [showTemplates, setShowTemplates] = useState(false)
  const recRef = useRef(null)

  function setOpt(i, k, v) {
    setOpts(prev => prev.map((o, idx) => idx === i ? { ...o, [k]: v } : o))
  }

  function applyTemplate(key) {
    const tpl = TEMPLATES[key]
    setOpts(tpl.map(t => ({ label: t.label, description: t.description, amount: String(t.amount) })))
    setRecIdx(1)
    setShowTemplates(false)
    showToast('Template applied ✓', 'success')
  }

  async function startVoice() {
    if (listening) return stopVoice()
    try {
      setListening(true)
      showToast('🎤 Recording… tap to stop', 'default')
      const lang = voiceLang === 'es-US' ? 'es' : 'en'
      const recorder = await startRecording(async (audioBlob) => {
        setListening(false)
        setProcessing(true)
        try {
          const text = await transcribeAudio(audioBlob, lang)
          if (text?.trim()) {
            await parseVoiceInput(text.trim())
          } else {
            showToast('Could not hear clearly. Try again closer to mic.', 'error')
          }
        } catch(e) {
          console.error(e)
          showToast('Connection error. Fill in manually or retry.', 'error')
        } finally {
          setProcessing(false)
        }
      })
      recRef.current = recorder
      // Auto-stop después de 10 segundos
      setTimeout(() => stopVoice(), 30000)
    } catch(e) {
      setListening(false)
      if (e.name === 'NotAllowedError') {
        showToast('Microphone permission denied', 'error')
      } else {
        showToast('Could not start recording', 'error')
      }
    }
  }

  function stopVoice() {
    try { recRef.current?.stop() } catch(e) {}
    setListening(false)
  }

  async function parseVoiceInput(text) {
    const t = text.trim()
    setDesc(t)
    // Usar IA para interpretar el texto en cualquier idioma
    const parsed = await parseVoiceWithAI(t)

    if (parsed) {
      if (parsed.job_description) setDesc(parsed.job_description)
      if (parsed.client_name) setClient(parsed.client_name)
      if (parsed.client_address) setAddress(parsed.client_address)
      if (parsed.client_phone) setPhone(parsed.client_phone)


      if (parsed.prices?.length >= 1) {
        setOpts(prev => prev.map((o, i) => ({
          ...o,
          amount: String(parsed.prices[i] || o.amount || '')
        })))
      }
      const flags = [
        parsed.client_name ? '👤' : '',
        parsed.client_address ? '📍' : '',
        parsed.prices?.length ? '💰' : '',
      ].filter(Boolean).join(' ')
      showToast(`Got it! ${flags} Review and adjust.`, 'success')
    } else {
      showToast('Voice captured — fill in the details.', 'default')
    }
  }

  async function handleSave() {
    if (!desc.trim()) return showToast('Add a job description')
    const options = opts.map((o, i) => ({
      label: o.label || `Option ${i + 1}`,
      description: o.description,
      amount: parseFloat(o.amount) || 0,
      is_selected: i === recIdx,
    }))
    if (options.some(o => !o.amount)) return showToast('Add a price for each option')

    setLoading(true)
    try {
      const job = await saveJob({ desc, client, phone, address, options, scheduledDate, scheduledTime })
      const link = `${BASE_URL}/q/${job.public_token}`
      onSuccess({ job, link, client, phone, address, desc, opts: options })
    } catch (e) {
      showToast(e.message?.slice(0, 80) || 'Error saving. Try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",padding:"16px 16px 96px"}}>

      {/* Modo guiado — pantalla completa */}
      {guidedMode && (
        <GuidedVoicePage
          onCancel={() => setGuidedMode(false)}
          onDone={(data) => {
            setGuidedMode(false)
            if (data.desc) setDesc(data.desc)
            if (data.client) setClient(data.client)
            if (data.address) setAddress(data.address)
            if (data.phone) setPhone(data.phone)
            if (data.aiResult) {
              if (data.aiResult.job_description) setDesc(data.aiResult.job_description)
              if (data.aiResult.options?.length === 3) {
                setOpts(data.aiResult.options.map(o => ({
                  label: o.label || '',
                  description: o.description || '',
                  amount: String(o.amount || ''),
                })))
              }
            }
            showToast('Quote ready! Review and send. ✓', 'success')
          }}
        />
      )}

      {/* Overlay de procesamiento — se muestra mientras Whisper + GPT trabajan */}
      {processing && (
        <div className="fixed inset-0 bg-jefe/90 z-50 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-16 h-16 border-4 border-white/20 border-t-naranja rounded-full animate-spin"/>
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-2">Creating your quote…</div>
            <div className="text-white/60 text-sm">Whisper is transcribing your voice</div>
            <div className="text-white/60 text-sm mt-1">AI is building the 3 options</div>
          </div>
          <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
            <p className="text-white/80 text-xs italic">This takes about 5 seconds</p>
          </div>
        </div>
      )}
      <div className="card">
        {/* Modos de entrada */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Modo guiado — el diferenciador */}
          <button onClick={() => setGuidedMode(true)}
            className="flex flex-col items-center gap-1 py-3 px-2 bg-naranja rounded-xl text-white active:scale-95 transition-all">
            <span className="text-2xl">🎙️</span>
            <span className="text-xs font-bold">Guided Voice</span>
            <span className="text-xs opacity-70">Step by step</span>
          </button>
          {/* Templates */}
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="flex flex-col items-center gap-1 py-3 px-2 bg-white border-2 border-borde rounded-xl text-muted active:scale-95 transition-all">
            <span className="text-2xl">📋</span>
            <span className="text-xs font-bold text-jefe">Templates</span>
            <span className="text-xs">Pick a preset</span>
          </button>
        </div>

        {/* Dictado libre — para usuarios avanzados */}
        <div className="mb-4">
          <div className="flex gap-1.5 mb-2">
            {[['en-US','🇺🇸 EN'],['es-US','🇲🇽 ES']].map(([l, label]) => (
              <button key={l} onClick={() => setVoiceLang(l)}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg border-2 transition-all
                  ${voiceLang === l ? 'border-naranja bg-naranja-light text-naranja' : 'border-borde text-muted'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={listening ? stopVoice : startVoice}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95
              ${listening ? 'border-rojo bg-red-50 text-rojo' : 'border-borde text-muted'}`}>
            {listening
              ? <><span className="inline-block w-2 h-2 bg-rojo rounded-full animate-pulse"/> Listening… tap to stop</>
              : <>🎤 Quick dictate — say everything at once</>
            }
          </button>
          {/* Guía de qué decir */}
          {!listening && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-borde">
              <p className="text-xs font-bold text-muted mb-1">💡 Example — say something like:</p>
              <p className="text-xs text-muted italic leading-relaxed">
                "Water heater repair for John Davis at 412 Oak Street. Basic 280, recommended 650, premium 1200."
              </p>
            </div>
          )}
          {listening && (
            <div className="mt-2 bg-red-50 rounded-xl p-3 border-2 border-rojo flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-rojo rounded-full animate-pulse"/>
                <span className="text-sm font-bold text-rojo">Recording — speak clearly</span>
              </div>
              <p className="text-xs text-center text-muted">Say client name, address, job and prices. Tap to stop.</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_,i) => (
                  <div key={i} className="w-1 bg-rojo rounded-full animate-bounce"
                    style={{height: `${8 + Math.random()*16}px`, animationDelay: `${i*0.1}s`}}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Templates dropdown */}
        {showTemplates && (
          <div className="mb-4 border-2 border-borde rounded-xl overflow-hidden">
            {Object.keys(TEMPLATES).map(k => (
              <button key={k} onClick={() => applyTemplate(k)}
                className="w-full text-left px-4 py-3 text-sm font-semibold capitalize border-b border-borde last:border-0 hover:bg-gray-50">
                {k === 'hvac' ? '❄️ HVAC' : k === 'plumbing' ? '🔧 Plumbing' : k === 'electrical' ? '⚡ Electrical' : '🔑 Locksmith'}
              </button>
            ))}
          </div>
        )}

        {/* Job details */}
        <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-borde">Job details</div>
        <label className="block text-xs font-semibold text-muted mb-1">What's the job? *</label>
        <textarea className="input" rows={2} placeholder="e.g. Panel replacement, Leak under sink, AC not cooling"
          value={desc} onChange={e => setDesc(e.target.value)} />
        <label className="block text-xs font-semibold text-muted mb-1 mt-3">Client name</label>
        <input className="input" placeholder="e.g. John Smith" value={client} onChange={e => setClient(e.target.value)} />
        <label className="block text-xs font-semibold text-muted mb-1 mt-3">Job address</label>
        <input className="input" placeholder="e.g. 123 Main St, Houston TX" value={address} onChange={e => setAddress(e.target.value)} />
        <label className="block text-xs font-semibold text-muted mb-1 mt-3">Client phone / WhatsApp</label>
        <input className="input" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Date (optional)</label>
            <input className="input" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Time (optional)</label>
            <input className="input" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quote options */}
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Quote options</div>
      {opts.map((opt, i) => (
        <div key={i} className={`card relative border-2 ${i === recIdx ? 'border-naranja' : 'border-transparent'}`}>
          <div className={`absolute -top-2.5 left-3 text-xs font-bold px-2 py-0.5 rounded-full text-white
            ${i === recIdx ? 'bg-naranja' : 'bg-jefe'}`}>
            Option {i + 1}{i === recIdx ? ' ⭐' : ''}
          </div>
          <label className="block text-xs font-semibold text-muted mb-1 mt-1">Option name *</label>
          <input className="input" placeholder={i === 0 ? 'Basic' : i === 1 ? 'Recommended' : 'Premium'}
            value={opt.label} onChange={e => setOpt(i, 'label', e.target.value)} />
          <label className="block text-xs font-semibold text-muted mb-1 mt-3">What's included</label>
          <textarea className="input" rows={2} placeholder="Parts and labor included..."
            value={opt.description} onChange={e => setOpt(i, 'description', e.target.value)} />
          <label className="block text-xs font-semibold text-muted mb-1 mt-3">Price ($) *</label>
          <input className="input" type="number" placeholder="0"
            value={opt.amount} onChange={e => setOpt(i, 'amount', e.target.value)} />
          <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm text-muted">
            <input type="checkbox" className="accent-naranja w-4 h-4"
              checked={i === recIdx} onChange={() => setRecIdx(i)} />
            ⭐ Best value (shown to client)
          </label>
        </div>
      ))}

      <button className="btn-primary mb-6" disabled={loading} onClick={handleSave}>
        {loading ? 'Saving…' : 'Generate quote link →'}
      </button>
    </div>
  )
}
