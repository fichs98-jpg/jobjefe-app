import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

export default function ResetPasswordPage({ onDone }) {
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function doReset() {
    if (!pass || pass.length < 8) return setError('Password must be at least 8 characters.')
    if (pass !== pass2) return setError('Passwords do not match.')
    setLoading(true); setError('')
    const { error } = await sb.auth.updateUser({ password: pass })
    setLoading(false)
    if (error) return setError(error.message)
    setDone(true)
    setTimeout(() => onDone(), 2000)
  }

  if (done) return (
    <div className="min-h-screen bg-jefe flex flex-col items-center justify-center px-6">
      <div className="text-3xl font-extrabold text-white mb-1">Job<span className="text-naranja">Jefe</span></div>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center mt-8">
        <div className="text-4xl mb-3">✅</div>
        <div className="font-bold text-jefe text-lg mb-2">Password updated!</div>
        <p className="text-sm text-muted">Taking you to the app…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-jefe flex flex-col items-center justify-center px-6">
      <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
        Job<span className="text-naranja">Jefe</span>
      </div>
      <p className="text-white/60 text-sm mb-8">Choose a new password</p>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        {error && <div className="bg-red-50 text-rojo text-xs p-3 rounded-lg mb-3">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">New password</label>
            <input className="input" type="password" placeholder="Min. 8 characters"
              value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Confirm password</label>
            <input className="input" type="password" placeholder="Repeat password"
              value={pass2} onChange={e => setPass2(e.target.value)} />
          </div>
          <button className="btn-primary mt-1" disabled={loading} onClick={doReset}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </div>
      </div>
    </div>
  )
}
