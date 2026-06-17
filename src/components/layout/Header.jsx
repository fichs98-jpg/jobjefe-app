import { useStore } from '../../store/useStore'

export default function Header({ onRefresh, onProfile }) {
  const { user, isOnline } = useStore()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || '?'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="bg-jefe h-14 flex items-center px-4 justify-between flex-shrink-0 pt-safe">
      <div className="text-white text-xl font-extrabold tracking-tight">
        Job<span className="text-naranja">Jefe</span>
      </div>
      <div className="flex items-center gap-2">
        {!isOnline && (
          <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">Offline</span>
        )}
        <button onClick={onRefresh} className="text-white/70 text-lg px-1">↻</button>
        <button
          onClick={onProfile}
          className="w-8 h-8 rounded-full bg-naranja text-white text-xs font-bold flex items-center justify-center"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
