import { useStore } from '../../store/useStore'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg transition-all whitespace-nowrap
      ${toast.type === 'error' ? 'bg-rojo' : toast.type === 'success' ? 'bg-verde' : 'bg-jefe'}`}>
      {toast.msg}
    </div>
  )
}
