import { useStore } from '../store/useStore'

const fmt = v => v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : ''
const fmtDate = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const jobAmount = job => { const rec = job.options?.find(o => o.is_selected) || job.options?.[1] || job.options?.[0]; return rec?.amount }
const STATUS_COLORS = { sent: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', draft: 'bg-gray-100 text-gray-600', completed: 'bg-blue-100 text-blue-800' }
const DOT_COLORS = { sent: 'bg-yellow-400', approved: 'bg-verde', draft: 'bg-muted', completed: 'bg-jefe' }

export default function JobsPage({ onDetail }) {
  const { jobs } = useStore()
  return (
    <div className="screen pt-4">
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">All quotes</div>
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-bold text-jefe mb-1">No quotes yet</div>
          <p className="text-sm">Tap + to create your first quote.</p>
        </div>
      ) : jobs.map(job => {
        const amount = jobAmount(job)
        return (
          <div key={job.id} onClick={() => onDetail(job.id)}
            className="bg-white rounded-xl p-4 shadow-sm mb-2.5 flex items-center gap-3 cursor-pointer active:scale-99 transition-transform">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[job.status] || 'bg-muted'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{job.service_description || 'Untitled'}</div>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                {job.client_name || 'No client'} · {fmtDate(job.created_at)}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>{job.status}</span>
              </div>
            </div>
            {amount != null && <div className="font-bold text-naranja text-sm whitespace-nowrap">{fmt(amount)}</div>}
          </div>
        )
      })}
    </div>
  )
}
