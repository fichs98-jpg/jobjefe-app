import { useStore } from '../store/useStore'

export default function SuccessModal({ data, onClose }) {
  const { showToast } = useStore()
  if (!data) return null
  const { link, client, phone } = data
  const phoneClean = phone?.replace(/[\s\-\(\)]/g, '') || ''
  const waMsg = encodeURIComponent(`Hi ${client || ''}! Here's your quote — tap to review and approve: ${link}`)
  const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${waMsg}` : `https://wa.me/?text=${waMsg}`

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => showToast('Link copied! ✓', 'success'))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto pb-safe">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-lg font-bold text-jefe">Quote ready to send!</div>
          <div className="text-sm text-muted mt-1">Share the link with your client.</div>
        </div>

        <div className="bg-naranja-light border-2 border-dashed border-naranja rounded-xl p-3 flex items-center gap-2 mb-4">
          <span className="flex-1 text-xs text-naranja font-mono break-all">{link}</span>
          <button onClick={copyLink} className="bg-naranja text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">Copy</button>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={onClose} className="btn-ghost flex-1">Close</button>
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-2 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl text-sm flex-1 active:scale-95 transition-transform">
            💬 Send via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
