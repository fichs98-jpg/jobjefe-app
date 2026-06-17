import { useState } from 'react'
import { sb } from '../lib/supabase'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', pass: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function doLogin() {
    if (!form.email || !form.pass) return setError('Fill all fields.')
    setLoading(true); setError('')
    const { error } = await sb.auth.signInWithPassword({ email: form.email, password: form.pass })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function doSignup() {
    if (!form.name || !form.email || !form.pass) return setError('Fill all fields.')
    if (form.pass.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true); setError('')
    const { error } = await sb.auth.signUp({ email: form.email, password: form.pass, options: { data: { name: form.name } } })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-jefe flex flex-col items-center justify-center px-6">
      <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
        Job<span className="text-naranja">Jefe</span>
      </div>
      <p className="text-white/60 text-sm mb-8">Run your jobs like a jefe.</p>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          {['login','signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all
                ${tab === t ? 'bg-white text-jefe shadow-sm' : 'text-muted'}`}>
              {t === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-rojo text-xs p-3 rounded-lg mb-3">{error}</div>}

        <div className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Your name</label>
              <input className="input" placeholder="Mike Johnson" value={form.name}
                onChange={e => set('name', e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={form.email}
              onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.pass}
              onChange={e => set('pass', e.target.value)} />
          </div>
          <button className="btn-primary mt-1" disabled={loading}
            onClick={tab === 'login' ? doLogin : doSignup}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
