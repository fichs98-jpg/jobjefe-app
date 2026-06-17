import { useStore } from '../store/useStore'
import { useJobs } from '../hooks/useJobs'

const fmt = v => v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : ''
const fmtDate = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const jobAmount = job => { const rec = job.options?.find(o => o.is_selected) || job.options?.[1] || job.options?.[0]; return rec?.amount }

const STATUS_COLORS = { sent: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', draft: 'bg-gray-100 text-gray-600', completed: 'bg-blue-100 text-blue-800' }
const DOT_COLORS = { sent: 'bg-yellow-400', approved: 'bg-verde', draft: 'bg-muted', completed: 'bg-jefe' }

export default function HomePage({ onNewJob, onDetail }) {
  const { jobs } = useStore()

  const sent = jobs.length
  const approved = jobs.filter(j => j.status === 'approved').length
  const recentApproved = jobs.filter(j => {
    if (j.status !== 'approved') return false
    const ts = j.approved_at || j.updated_at
    if (!ts) return false
    return Date.now() - new Date(ts).getTime() < 86400000
  })
  const recent = jobs.slice(0, 5)

  return (
    <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",padding:"16px 16px 96px"}}>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[{ num: sent, label: 'Total quotes' }, { num: approved, label: 'Approved' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-naranja">{s.num}</div>
            <div className="text-xs text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Banner aprobaciones recientes */}
      {recentApproved.length > 0 && (
        <div className="bg-green-50 border-2 border-verde rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-bold text-sm text-green-800">
              {recentApproved.length === 1 ? 'A client just approved!' : `${recentApproved.length} clients approved!`}
            </div>
            <div className="text-xs text-green-700">
              {recentApproved.map(j => j.client_name || 'Client').join(', ')} · Tap to see
            </div>
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Recent quotes</div>

      {recent.length === 0 ? (
        <div className="bg-white rounded-xl p-7 shadow-sm text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-bold text-jefe mb-2">Create your first quote</div>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Fill in the job details and 3 price options.<br />
            Your client gets a link to approve with one tap.
          </p>
          <button onClick={onNewJob} className="btn-primary">+ Create first quote</button>
          <div className="text-xs text-muted mt-3">Takes less than 60 seconds ⚡</div>
        </div>
      ) : (
        recent.map(job => (
          <div key={job.id} onClick={() => onDetail(job.id)}
            className="bg-white rounded-xl p-4 shadow-sm mb-2.5 flex items-center gap-3 cursor-pointer active:scale-99 transition-transform">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[job.status] || 'bg-muted'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{job.service_description || 'Untitled'}</div>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                {job.client_name || 'No client'} · {fmtDate(job.created_at)}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>{job.status}</span>
              </div>
            </div>
            {jobAmount(job) != null && <div className="font-bold text-naranja text-sm">{fmt(jobAmount(job))}</div>}
          </div>
        ))
      )}

      {/* FAB */}
      <button onClick={onNewJob}
        className="fixed bottom-20 right-4 w-14 h-14 bg-naranja rounded-full text-white text-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform z-10">
        +
      </button>
    </div>
  )
}
