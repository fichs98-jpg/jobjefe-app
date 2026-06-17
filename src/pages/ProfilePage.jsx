import { useState } from 'react'
import { sb } from '../lib/supabase'
import { useStore } from '../store/useStore'

export default function ProfilePage() {
  const { user, jobs, showToast } = useStore()
  const [uploading, setUploading] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || '?'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // Stats
  const totalJobs = jobs.length
  const approved = jobs.filter(j => j.status === 'approved').length
  const totalRevenue = jobs
    .filter(j => j.status === 'approved')
    .reduce((sum, j) => {
      const rec = j.options?.find(o => o.is_selected) || j.options?.[0]
      return sum + (rec?.amount || 0)
    }, 0)

  async function saveWhatsApp() {
    if (!waPhone.trim()) return showToast('Enter your WhatsApp number', 'error')
    setSavingPhone(true)
    const { error } = await sb.from('users').update({ whatsapp_phone: waPhone.trim() }).eq('id', user.id)
    setSavingPhone(false)
    if (error) return showToast('Error saving. Try again.', 'error')
    showToast('WhatsApp saved ✓', 'success')
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Max logo size: 2MB', 'error')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error: upErr } = await sb.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) { showToast('Upload failed', 'error'); setUploading(false); return }
    const { data } = sb.storage.from('logos').getPublicUrl(path)
    await sb.from('users').update({ logo_url: data.publicUrl }).eq('id', user.id)
    showToast('Logo updated ✓', 'success')
    setUploading(false)
  }

  function exportCSV() {
    const rows = [['Date','Client','Description','Status','Amount']]
    jobs.forEach(j => {
      const rec = j.options?.find(o => o.is_selected) || j.options?.[0]
      rows.push([j.created_at?.split('T')[0], j.client_name||'', j.service_description||'', j.status, rec?.amount||0])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'jobjefe-export.csv'; a.click()
    showToast('CSV exported ✓', 'success')
  }

  async function doLogout() {
    await sb.auth.signOut()
  }

  return (
    <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",padding:"16px 16px 96px"}}>
      {/* Profile header */}
      <div className="card flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-full bg-naranja text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-bold text-jefe">{name}</div>
          <div className="text-xs text-muted">{user?.email}</div>
        </div>
      </div>

      {/* Stats resumen */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { num: totalJobs, label: 'Total' },
          { num: approved, label: 'Approved' },
          { num: `$${(totalRevenue/1000).toFixed(1)}k`, label: 'Revenue' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-xl font-extrabold text-naranja">{s.num}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* WhatsApp para notificaciones */}
      <div className="card mb-3">
        <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">WhatsApp notifications</div>
        <p className="text-xs text-muted mb-3">Get a WhatsApp message the instant your client approves a quote.</p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={waPhone}
            onChange={e => setWaPhone(e.target.value)}
          />
          <button
            onClick={saveWhatsApp}
            disabled={savingPhone}
            className="bg-naranja text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap active:scale-95 transition-all disabled:opacity-50">
            {savingPhone ? '...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Logo upload */}
      <div className="card mb-3">
        <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Business logo</div>
        <p className="text-xs text-muted mb-3">Your logo appears on client quote pages and PDFs.</p>
        <label className={`btn-ghost flex items-center justify-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? '⏳ Uploading…' : '📷 Upload logo'}
          <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploading} />
        </label>
      </div>

      {/* Menu items */}
      <div className="card">
        <button onClick={exportCSV}
          className="w-full flex items-center gap-3 py-3.5 border-b border-borde text-sm font-medium text-left">
          <span className="text-lg">📊</span> Export data (CSV)
          <span className="ml-auto text-muted">›</span>
        </button>
        <button onClick={() => showToast('Coming soon')}
          className="w-full flex items-center gap-3 py-3.5 border-b border-borde text-sm font-medium text-left">
          <span className="text-lg">🔔</span> Notifications
          <span className="ml-auto text-muted">›</span>
        </button>
        <button onClick={() => showToast('Coming soon')}
          className="w-full flex items-center gap-3 py-3.5 border-b border-borde text-sm font-medium text-left">
          <span className="text-lg">💳</span> Subscription
          <span className="ml-auto text-muted">›</span>
        </button>
        <button onClick={doLogout}
          className="w-full flex items-center gap-3 py-3.5 text-sm font-medium text-rojo text-left">
          <span className="text-lg">🚪</span> Sign out
        </button>
      </div>

      <div className="text-center text-xs text-muted mt-4 pb-4">
        JobJefe v1.0 · <a href="https://jobjefe.com" className="text-muted">jobjefe.com</a>
      </div>
    </div>
  )
}
