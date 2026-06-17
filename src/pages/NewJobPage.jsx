import { useState, useRef } from 'react'
import { useJobs } from '../hooks/useJobs'
import { useStore } from '../store/useStore'

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

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return showToast('Voice not supported in this browser', 'error')
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); showToast('Voice error. Try again.', 'error') }
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      parseVoiceInput(text)
    }
    recRef.current = rec
    rec.start()
  }

  function parseVoiceInput(text) {
    // Limpiar el texto
    const t = text.trim()
    setDesc(t)

    // Extraer nombre del cliente: "for John", "client John Smith", "customer Maria"
    const clientMatch = t.match(/(?:for|client|customer|mr\.?|mrs\.?|ms\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (clientMatch) setClient(clientMatch[1])

    // Extraer dirección: números seguidos de nombre de calle
    const addrMatch = t.match(/\b(\d+\s+[A-Za-z]+(?:\s+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Ct|Circle|Street|Avenue|Road|Drive))?(?:,\s*[A-Za-z\s]+)?)\b/i)
    if (addrMatch) setAddress(addrMatch[1])

    // Extraer teléfono
    const phoneMatch = t.match(/\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/)
    if (phoneMatch) setPhone(phoneMatch[0])

    // Extraer precios: "$180", "180 dollars", "one eighty"
    const prices = [...t.matchAll(/\$?\s?(\d{2,5})(?:\s*dollars?)?/gi)].map(m => parseInt(m[1])).filter(n => n >= 50 && n <= 50000)
    if (prices.length >= 1) setOpts(prev => prev.map((o, i) => ({ ...o, amount: String(prices[i] || '') })))

    showToast(`Voice captured! ${clientMatch ? '👤 ' : ''}${addrMatch ? '📍 ' : ''}${prices.length ? '💰 ' : ''}Review fields.`, 'success')
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
    <div className="screen pt-4">
      <div className="card">
        {/* Voz + Templates */}
        <div className="flex gap-2 mb-4">
          <button onClick={startVoice}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
              ${listening ? 'border-rojo bg-red-50 text-rojo animate-pulse' : 'border-naranja text-naranja'}`}>
            🎤 {listening ? 'Listening…' : 'Voice input'}
          </button>
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-borde text-muted">
            📋 Templates
          </button>
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
