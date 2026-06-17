import { useStore } from '../../store/useStore'

const tabs = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'jobs', icon: '📋', label: 'Quotes' },
  { id: 'new', icon: '➕', label: 'New' },
  { id: 'agenda', icon: '📅', label: 'Agenda' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav({ screen, onNavigate }) {
  return (
    <nav className="h-15 bg-white border-t border-borde flex flex-shrink-0 pb-safe">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onNavigate(t.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors
            ${screen === t.id ? 'text-naranja' : 'text-muted'}`}
        >
          <span className="text-xl leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
