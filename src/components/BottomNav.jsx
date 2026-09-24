import { House, Compass, Radio, ListMusic, Search } from 'lucide-react'

export default function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'songs', label: 'Listen Now', icon: House },
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'playlists', label: 'Library', icon: ListMusic },
    { id: 'search', label: 'Search', icon: Search }
  ]
  return (
    <nav aria-label="Navigasi utama" className="glass sticky bottom-0 z-20 flex md:hidden">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`touch-target flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
            tab === t.id ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300 active:text-white'
          }`}
        >
          <t.icon size={22} strokeWidth={tab === t.id ? 2.4 : 1.8} fill={tab === t.id ? 'currentColor' : 'none'} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
