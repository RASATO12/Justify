import { House, ListMusic, Search, Settings } from 'lucide-react'

export default function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'songs', label: 'Home', icon: House },
    { id: 'search', label: 'Cari', icon: Search },
    { id: 'playlists', label: 'Playlist', icon: ListMusic },
    { id: 'settings', label: 'Setting', icon: Settings }
  ]
  return (
    <nav aria-label="Navigasi utama" className="glass sticky bottom-0 z-20 flex md:hidden">
      {items.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id === 'search' ? 'songs' : t.id)} className={`touch-target flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition ${tab === t.id || (t.id === 'search' && tab === 'songs') ? 'text-violet-300' : 'text-zinc-400 hover:text-zinc-200 active:text-white'}`}>
          <t.icon size={21} /> {t.label}
        </button>
      ))}
    </nav>
  )
}
