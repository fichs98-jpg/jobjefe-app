import { useState } from 'react'
import { useStore } from '../store/useStore'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const fmt = v => v != null ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) : ''

export default function AgendaPage({ onDetail }) {
  const { jobs } = useStore()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    return d
  })

  const scheduledJobs = jobs.filter(j => j.scheduled_date === selectedDate)
  const unscheduled = jobs.filter(j => !j.scheduled_date && j.status === 'sent')

  const routeAddresses = scheduledJobs
    .filter(j => j.client_address)
    .map(j => encodeURIComponent(j.client_address))

  const mapsUrl = routeAddresses.length > 0
    ? `https://www.google.com/maps/dir/${routeAddresses.join('/')}`
    : null

  return (
    <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",padding:"16px 16px 96px"}}>
      {/* Week strip */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {weekDays.map(d => {
          const iso = d.toISOString().split('T')[0]
          const hasJobs = jobs.some(j => j.scheduled_date === iso)
          const isSelected = iso === selectedDate
          return (
            <button key={iso} onClick={() => setSelectedDate(iso)}
              className={`flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl text-xs font-bold transition-all
                ${isSelected ? 'bg-naranja text-white' : 'bg-white text-jefe shadow-sm'}`}>
              <span className="text-xs opacity-70">{DAYS[d.getDay()]}</span>
              <span className="text-base font-extrabold">{d.getDate()}</span>
              {hasJobs && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-naranja'}`} />}
            </button>
          )
        })}
      </div>

      {/* Open route button */}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-jefe text-white font-bold py-3 rounded-xl mb-4 text-sm active:scale-95 transition-transform">
          🗺️ Open route in Maps ({scheduledJobs.filter(j => j.client_address).length} stops)
        </a>
      )}

      {/* Jobs for selected day */}
      <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
        {scheduledJobs.length === 0 ? 'No jobs scheduled' : `${scheduledJobs.length} job${scheduledJobs.length > 1 ? 's' : ''} scheduled`}
      </div>

      {scheduledJobs.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center text-muted">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm">No jobs for this day.<br />Schedule a job when creating a quote.</div>
        </div>
      ) : scheduledJobs.map((job, i) => (
        <div key={job.id} onClick={() => onDetail(job.id)}
          className="bg-white rounded-xl p-4 shadow-sm mb-2.5 cursor-pointer active:scale-99 transition-transform">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-muted">{job.scheduled_time || '—'}</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full">{job.status}</span>
              </div>
              <div className="font-semibold text-sm">{job.service_description}</div>
              {job.client_name && <div className="text-xs text-muted mt-0.5">👤 {job.client_name}</div>}
              {job.client_address && <div className="text-xs text-muted mt-0.5">📍 {job.client_address}</div>}
              {job.client_phone && <div className="text-xs text-muted mt-0.5">📱 {job.client_phone}</div>}
            </div>
          </div>
        </div>
      ))}

      {/* Unscheduled pending */}
      {unscheduled.length > 0 && (
        <>
          <div className="text-xs font-bold uppercase tracking-widest text-muted mt-4 mb-2">Pending — not scheduled</div>
          {unscheduled.slice(0, 3).map(job => (
            <div key={job.id} onClick={() => onDetail(job.id)}
              className="bg-white rounded-xl p-3 shadow-sm mb-2 flex items-center gap-3 cursor-pointer opacity-70">
              <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{job.service_description}</div>
                <div className="text-xs text-muted">{job.client_name || 'No client'}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
