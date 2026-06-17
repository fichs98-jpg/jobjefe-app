import { useEffect, useState } from 'react'
import { sb } from './lib/supabase'
import { useStore } from './store/useStore'
import { useJobs } from './hooks/useJobs'

import AuthPage from './pages/AuthPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import NewJobPage from './pages/NewJobPage'
import DetailPage from './pages/DetailPage'
import AgendaPage from './pages/AgendaPage'
import ProfilePage from './pages/ProfilePage'
import SuccessModal from './pages/SuccessModal'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Toast from './components/ui/Toast'

export default function App() {
  const { user, setUser, setOnline, showToast } = useStore()
  const { loadJobs } = useJobs()
  const [screen, setScreen] = useState('home')
  const [detailId, setDetailId] = useState(null)
  const [successData, setSuccessData] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)

  // Auth listener — detecta PASSWORD_RECOVERY event
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthReady(true)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true)
        setUser(session?.user || null)
        setAuthReady(true)
        return
      }
      setUser(session?.user || null)
      setIsResetMode(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load jobs when user is set
  useEffect(() => {
    if (user && !isResetMode) loadJobs()
  }, [user, isResetMode])

  // Online/offline
  useEffect(() => {
    const onOnline = () => { setOnline(true); showToast('Back online ✓', 'success'); loadJobs() }
    const onOffline = () => { setOnline(false); showToast("You're offline", 'error') }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // Polling cada 30s
  useEffect(() => {
    if (!user || isResetMode) return
    const interval = setInterval(loadJobs, 30000)
    return () => clearInterval(interval)
  }, [user, isResetMode])

  // Splash
  if (!authReady) return (
    <div className="min-h-screen bg-jefe flex items-center justify-center">
      <div className="text-2xl font-extrabold text-white">Job<span className="text-naranja">Jefe</span></div>
    </div>
  )

  // Reset password mode
  if (isResetMode) return (
    <ResetPasswordPage onDone={() => {
      setIsResetMode(false)
      loadJobs()
    }} />
  )

  // Not logged in
  if (!user) return <AuthPage />

  function navigate(s) {
    setScreen(s)
    setDetailId(null)
  }

  function showDetail(id) {
    setDetailId(id)
    setScreen('detail')
  }

  function handleNewJobSuccess(data) {
    setSuccessData(data)
    setScreen('home')
    loadJobs()
  }

  return (
    <div className="flex flex-col h-full h-dvh bg-gray-100">
      <Header
        onRefresh={() => { loadJobs(); showToast('Updated ✓') }}
        onProfile={() => navigate('profile')}
      />
      <div style={{flex:1,minHeight:0,position:"relative",display:"flex",flexDirection:"column"}}>
        {screen === 'home'    && <HomePage onNewJob={() => navigate('new')} onDetail={showDetail} />}
        {screen === 'jobs'    && <JobsPage onDetail={showDetail} />}
        {screen === 'new'     && <NewJobPage onSuccess={handleNewJobSuccess} />}
        {screen === 'detail'  && <DetailPage jobId={detailId} onBack={() => navigate('jobs')} />}
        {screen === 'agenda'  && <AgendaPage onDetail={showDetail} />}
        {screen === 'profile' && <ProfilePage />}
      </div>
      <BottomNav screen={screen} onNavigate={navigate} />
      <Toast />
      {successData && <SuccessModal data={successData} onClose={() => setSuccessData(null)} />}
    </div>
  )
}
