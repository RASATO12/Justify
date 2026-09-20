import { Disc3, FolderOpen, ListMusic, Music2, Search, Upload } from 'lucide-react'
import { useState } from 'react'
import { FALLBACK_COVER, formatTime } from '../lib/utils'

export default function LibraryPanel({ songs, playlists, tab, setTab, onPick, onUpload, onUploadFolder, loading, uploadProgress }) {
  const [q, setQ] = useState('')
  const list = songs.filter((s) => `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q.toLowerCase()))
  const pct = uploadProgress?.active ? Math.round((uploadProgress.done / Math.max(1, uploadProgress.total)) * 100) : 0
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul, artis, album..."
            aria-label="Cari musik"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-violet-500"
          />
        </div>
        <button onClick={onUpload} aria-label="Tambah file lagu" title="Tambah File" className="touch-target flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold hover:bg-violet-500 active:scale-[.98]">
          <Upload size={18} /> <span className="hidden sm:inline">Tambah File</span>
        </button>
        <button onClick={onUploadFolder} aria-label="Tambah folder lagu" title="Tambah Folder" className="touch-target flex h-11 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-medium text-zinc-200 hover:bg-white/10 active:bg-white/15">
          <FolderOpen size={18} /> <span className="hidden sm:inline">Folder</span>
        </button>
      </div>
      {uploadProgress?.active && (
        <div role="status" aria-live="polite" className="mt-2 rounded-xl border border-violet-500/30 bg-violet-600/10 p-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Menambahkan {uploadProgress.done}/{uploadProgress.total} lagu</span>
            <span className="font-mono text-violet-300">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 truncate text-xs text-zinc-400">{uploadProgress.current}</p>
        </div>
      )}
      <div role="tablist" aria-label="Kategori library" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'songs', label: 'Lagu', icon: Music2 },
          { id: 'albums', label: 'Album', icon: Disc3 },
          { id: 'playlists', label: 'Playlist', icon: ListMusic }
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`touch-target flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${tab === t.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10 active:bg-white/15'}`}
          >
            <t.icon size={17} /> {t.label}
          </button>
        ))}
      </div>
      <div className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="aspect-square rounded-xl bg-zinc-800" />
                <div className="mt-2 h-4 rounded bg-zinc-800" />
                <div className="mt-1 h-3 w-2/3 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : tab === 'playlists' ? (
          <div className="space-y-2">
            {playlists.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">Belum ada playlist. Buat dari tombol + di bawah.</p>}
            {playlists.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div><p className="font-medium">{p.name}</p><p className="text-xs text-zinc-400">{p.count ?? 0} lagu</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {list.map((s) => (
              <button key={s.id} onClick={() => onPick(s)} className="group rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-violet-500/50 hover:bg-white/10 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
                <img src={s.coverUrl || FALLBACK_COVER} alt={`Cover ${s.album}`} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                <p className="mt-2 truncate text-sm font-semibold">{s.title}</p>
                <p className="truncate text-xs text-zinc-400">{s.artist} • {formatTime((s.durationMs || 0) / 1000)}</p>
              </button>
            ))}
          </div>
        )}
        {!loading && tab !== 'playlists' && list.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <Music2 size={32} className="text-violet-300" />
            <p className="font-display font-semibold">Library masih kosong</p>
            <p className="text-sm text-zinc-400">Upload file MP3, FLAC, M4A, WAV, OGG, OPUS atau ALAC. Semua tersimpan offline.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={onUpload} className="touch-target flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold hover:bg-violet-500 active:scale-[.98]">
                <Upload size={17} /> Tambah File
              </button>
              <button onClick={onUploadFolder} className="touch-target flex h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-medium text-zinc-200 hover:bg-white/10 active:bg-white/15">
                <FolderOpen size={17} /> Tambah Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
