import { Disc3, FolderOpen, ListMusic, MoreHorizontal, Music2, RotateCcw, Search, Upload } from 'lucide-react'
import { useState } from 'react'
import { resetDatabase } from '../lib/db'
import { FALLBACK_COVER, formatTime } from '../lib/utils'

export default function LibraryPanel({ songs, playlists, tab, setTab, onPick, onUpload, onUploadFolder, loading, uploadProgress }) {
  const [q, setQ] = useState('')
  const list = songs.filter((s) => `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q.toLowerCase()))
  const totalFiles = Number(uploadProgress?.total) || 0
  const doneFiles = Number(uploadProgress?.done) || 0
  const pct = totalFiles > 0 ? Math.max(0, Math.min(100, Math.round((doneFiles / totalFiles) * 100))) : 0
  const scanningActive = Boolean(uploadProgress?.active)
  const currentName = uploadProgress?.current || ''

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {/* Header Search & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari lagu, artis, album..."
            aria-label="Cari musik"
            className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900/80 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-red-500/60"
          />
        </div>
        <button onClick={onUpload} aria-label="Tambah file lagu" title="Tambah File" className="touch-target flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 active:scale-[.98]">
          <Upload size={18} /> <span className="hidden sm:inline">File</span>
        </button>
        <button onClick={onUploadFolder} aria-label="Tambah folder lagu" title="Tambah Folder" className="touch-target flex h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/15 active:bg-white/20">
          <FolderOpen size={18} /> <span className="hidden sm:inline">Folder</span>
        </button>
      </div>

      {/* Upload/Scan Progress */}
      {scanningActive && (
        <div role="status" aria-live="polite" className="mt-2 rounded-xl border border-red-500/30 bg-red-600/10 p-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Menambahkan {doneFiles}/{totalFiles} lagu</span>
            <span className="font-mono text-red-400">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 truncate text-xs text-zinc-400">{currentName || 'Memulai scan...'}</p>
          {uploadProgress?.failed > 0 && <p className="mt-1 text-xs text-red-400">{uploadProgress.failed} gagal, lanjut scan</p>}
        </div>
      )}

      {/* Apple Music Style Filter Pills */}
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
            className={`touch-target flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-medium transition ${
              tab === t.id ? 'bg-red-600 text-white shadow-md shadow-red-900/30' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 active:bg-zinc-700'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto">
        {scanningActive && list.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2 animate-pulse bg-zinc-900/40" aria-hidden="true">
                <div className="h-12 w-12 rounded-lg bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-zinc-800" />
                  <div className="h-3 w-1/3 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2 animate-pulse bg-zinc-900/40">
                <div className="h-12 w-12 rounded-lg bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-zinc-800" />
                  <div className="h-3 w-1/3 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'playlists' ? (
          <div className="space-y-2">
            {playlists.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">Belum ada playlist.</p>}
            {playlists.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 hover:bg-zinc-800/60 active:bg-zinc-800 transition">
                <div>
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-xs text-zinc-400">{p.count ?? 0} lagu</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Apple Music Mobile Vertical List Rows */
          <div className="divide-y divide-white/5 border-t border-b border-white/5">
            {list.map((s) => (
              <div key={s.id} onClick={() => onPick(s)} className="group flex items-center gap-3 p-2 rounded-xl transition hover:bg-zinc-800/50 active:bg-zinc-800/80 cursor-pointer">
                <img
                  src={s.coverUrl || FALLBACK_COVER}
                  alt={`Cover ${s.album}`}
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm shadow-black/60"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-red-400 transition-colors">{s.title}</p>
                  <p className="truncate text-xs text-zinc-400">{s.artist} — {s.album}</p>
                </div>
                <span className="text-xs text-zinc-500 tabular-nums shrink-0">{formatTime((s.durationMs || 0) / 1000)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onPick(s) }}
                  aria-label="Opsi"
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 shrink-0"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab !== 'playlists' && list.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <Music2 size={32} className="text-red-400" />
            <p className="font-display font-semibold text-white">Library masih kosong</p>
            <p className="text-sm text-zinc-400">Upload file MP3, FLAC, M4A, WAV, OGG, OPUS atau ALAC. Semua tersimpan offline.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={onUpload} className="touch-target flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 active:scale-[.98]">
                <Upload size={17} /> Tambah File
              </button>
              <button onClick={onUploadFolder} className="touch-target flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-zinc-200 hover:bg-white/15 active:bg-white/20">
                <FolderOpen size={17} /> Tambah Folder
              </button>
            </div>
            <button onClick={() => { if (confirm('Hapus semua data aplikasi?')) void resetDatabase() }} className="touch-target mt-2 flex h-11 items-center gap-2 rounded-xl px-4 text-xs text-zinc-500 hover:text-red-400 active:scale-[.98]">
              <RotateCcw size={14} /> Reset App Data
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
