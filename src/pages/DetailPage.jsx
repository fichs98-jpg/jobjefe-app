import { useStore } from '../store/useStore'
import { jsPDF } from 'jspdf'

const fmt = v => v != null ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) : ''
const fmtDate = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
const BASE_URL = 'https://jobjefe.com'

export default function DetailPage({ jobId, onBack }) {
  const { jobs, showToast } = useStore()
  const job = jobs.find(j => j.id === jobId)
  if (!job) return <div className="screen pt-4"><div className="text-center text-muted py-12">Job not found</div></div>

  const link = `${BASE_URL}/q/${job.public_token}`
  const phoneClean = job.client_phone?.replace(/[\s\-\(\)]/g, '') || ''
  const waMsg = encodeURIComponent(`Hi ${job.client_name || ''}! Here's your quote — tap to review and approve: ${link}`)
  const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${waMsg}` : `https://wa.me/?text=${waMsg}`

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => showToast('Link copied! ✓', 'success'))
  }

  function downloadPDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const navy = [26,46,74], orange = [255,107,43], gray = [107,122,141], lightgray = [245,246,248]

    doc.setFillColor(...navy); doc.rect(0,0,W,38,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(255,255,255)
    doc.text('Job',14,24)
    doc.setTextColor(...orange); doc.text('Jefe',14+doc.getTextWidth('Job'),24)
    doc.setFontSize(10); doc.setTextColor(255,255,255); doc.setFont('helvetica','normal')
    doc.text('QUOTE',W-14,18,{align:'right'})
    doc.setFontSize(8); doc.setTextColor(200,210,220)
    doc.text(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),W-14,24,{align:'right'})

    let y=50
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...navy)
    doc.text(job.service_description||'Quote',14,y); y+=8

    doc.setFillColor(...lightgray); doc.roundedRect(14,y,W-28,28,3,3,'F'); y+=7
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...gray)
    doc.text('CLIENT',20,y); doc.text('ADDRESS',90,y); doc.text('PHONE',160,y); y+=5
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...navy)
    doc.text(job.client_name||'—',20,y)
    doc.text(job.client_address||'—',90,y,{maxWidth:60})
    doc.text(job.client_phone||'—',160,y); y+=18

    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...navy)
    doc.text('QUOTE OPTIONS',14,y); y+=5
    doc.setDrawColor(...orange); doc.setLineWidth(0.5); doc.line(14,y,W-14,y); y+=6

    ;(job.options||[]).forEach(opt => {
      const isRec = opt.is_selected; const boxH = opt.description ? 26 : 20
      if(isRec){
        doc.setFillColor(255,240,232); doc.roundedRect(14,y,W-28,boxH,3,3,'F')
        doc.setDrawColor(...orange); doc.setLineWidth(0.8); doc.roundedRect(14,y,W-28,boxH,3,3,'S')
        doc.setFillColor(...orange); doc.roundedRect(W-62,y-3,48,7,2,2,'F')
        doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255)
        doc.text('RECOMMENDED',W-38,y+1.5,{align:'center'})
      } else {
        doc.setFillColor(250,250,252); doc.roundedRect(14,y,W-28,boxH,3,3,'F')
        doc.setDrawColor(226,230,234); doc.setLineWidth(0.3); doc.roundedRect(14,y,W-28,boxH,3,3,'S')
      }
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...navy)
      doc.text(opt.label||'Option',20,y+9)
      doc.setFontSize(14); doc.setTextColor(...orange)
      doc.text(`$${Number(opt.amount).toLocaleString('en-US')}`,W-20,y+9,{align:'right'})
      if(opt.description){ doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray); doc.text(opt.description,20,y+16,{maxWidth:W-80}) }
      y+=boxH+4
    })

    doc.setFillColor(...navy); doc.rect(0,277,W,20,'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(200,210,220)
    doc.text('Powered by JobJefe · jobjefe.com · 0% commission, always.',W/2,288,{align:'center'})
    doc.save(`Quote-${(job.service_description||'job').replace(/[^a-zA-Z0-9]/g,'-').slice(0,30)}.pdf`)
    showToast('PDF downloaded ✓', 'success')
  }

  return (
    <div className="screen pt-0">
      {/* Hero */}
      <div className="bg-jefe -mx-4 px-4 pt-4 pb-4 mb-4">
        <button onClick={onBack} className="text-white/60 text-sm mb-2 flex items-center gap-1">← Back</button>
        <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">{job.status}</div>
        <div className="text-lg font-bold text-white leading-tight">{job.service_description || 'Job'}</div>
        <div className="text-xs text-white/60 mt-1">
          {job.client_name ? job.client_name + ' · ' : ''}{fmtDate(job.created_at)}
        </div>
        {job.client_address && <div className="text-xs text-white/70 mt-1">📍 {job.client_address}</div>}
        {job.client_phone && <div className="text-xs text-white/70 mt-0.5">📱 {job.client_phone}</div>}
        {job.status === 'approved' && (
          <div className="mt-2 bg-green-500 rounded-lg px-3 py-2 text-white text-sm font-bold">
            ✅ Approved by {job.approved_by_name} · {job.approved_at ? fmtDate(job.approved_at) : ''}
          </div>
        )}
      </div>

      {/* Client link */}
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Client link</div>
      <div className="bg-naranja-light border-2 border-dashed border-naranja rounded-xl p-3 flex items-center gap-2 mb-4">
        <span className="flex-1 text-xs text-naranja font-mono break-all">{link}</span>
        <button onClick={copyLink} className="bg-naranja text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">Copy</button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform">
          💬 WhatsApp
        </a>
        <button onClick={downloadPDF}
          className="flex-1 flex items-center justify-center gap-2 bg-jefe text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform">
          ⬇ PDF
        </button>
      </div>

      {/* Options */}
      <div className="card">
        <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Quote options</div>
        {(job.options || []).map(o => (
          <div key={o.id} className="flex justify-between items-start py-3 border-b border-borde last:border-0">
            <div>
              <div className="font-semibold text-sm">{o.label}{o.is_selected ? ' ⭐' : ''}</div>
              {o.description && <div className="text-xs text-muted mt-0.5">{o.description}</div>}
            </div>
            <div className="font-extrabold text-naranja whitespace-nowrap ml-2">{fmt(o.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
