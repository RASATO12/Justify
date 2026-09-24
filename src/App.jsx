import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cast, ListMusic, MessageSquare, Minimize2, MoreHorizontal, Pause, Play, Quote, Repeat, Shuffle, SkipBack, SkipForward, Star, Volume2, VolumeX } from 'lucide-react'
import BottomNav from './components/BottomNav'
import LibraryPanel from './components/LibraryPanel'
import LyricsPanel from './components/LyricsPanel'
import PlayerBar from './components/PlayerBar'
import RightPanel from './components/RightPanel'
import Visualizer from './components/Visualizer'
import { formatRate, formatTime, isAudioName } from './lib/utils'
import { ensureEngine, isDirectMode, resumeAudioContext, setDirectMode, setVolume } from './lib/audio'
import { db, getBlob, getCoverUrl, putBlob, putCover } from './lib/db'
import { parseLRC } from './lib/lrc'
import { durationOf, parseFile } from './lib/metadata'
import { ACCEPT_AUDIO, FALLBACK_COVER, uid } from './lib/utils'

const withTimeout = (promise, ms = 3000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])

export default function App() {
  const logoSlug = `${import.meta.env.BASE_URL}logo.svg`
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [tab, setTab] = useState('songs')
  const [loading, setLoading] = useState(true)
  const [currentId, setCurrentId] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVol] = useState(0.9)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [lyricLines, setLyricLines] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ active: false, done: 0, total: 0, current: '', failed: 0 })
  const [isScanning, setIsScanning] = useState(false)
  const audio = useRef(null)
  const fileRef = useRef(null)
  const folderRef = useRef(null)
  const urlRef = useRef('')

  const current = useMemo(() => songs.find((s) => s.id === currentId) ?? null, [songs, currentId])
  const direct = isDirectMode()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const refresh = useCallback(async () => {
    const [all, pls] = await Promise.all([db.songs.toArray(), db.playlists.toArray()])
    const withCovers = await Promise.all(all.map(async (s) => ({ ...s, coverUrl: s.coverKey ? await getCoverUrl(s.coverKey) : '' })))
    setSongs(withCovers)
    setPlaylists(pls)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  }, [refresh])

  useEffect(() => {
    const a = audio.current
    if (!a) return
    const onTime = () => setProgress(a.currentTime)
    const onEnd = () => {
      if (repeat === 'one') {
        a.currentTime = 0
        void a.play()
        return
      }
      next()
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
    }
  }, [repeat])

  const pick = async (song) => {
    await resumeAudioContext()
    const blob = await getBlob(song.audioKey)
    if (!blob) return
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const url = URL.createObjectURL(blob)
    urlRef.current = url
    const a = audio.current
    a.src = url
    if (!direct) ensureEngine(a)
    setVolume(volume)
    setCurrentId(song.id)
    setProgress(0)
    setLyricLines([])
    try {
      const lrcBlob = await getBlob(`${song.audioKey}:lrc`)
      const lrc = lrcBlob ? await lrcBlob.text() : ''
      if (lrc) setLyricLines(parseLRC(lrc))
    } catch { /* ponytail: tanpa lirik tetap putar */ }
    await a.play()
    setPlaying(true)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: song.title, artist: song.artist, album: song.album })
    }
  }

  const toggle = async () => {
    await resumeAudioContext()
    const a = audio.current
    if (!a?.src) return
    if (!direct) ensureEngine(a)
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      await a.play()
      setPlaying(true)
    }
  }

  const next = () => {
    if (!songs.length || !current) return
    const i = songs.findIndex((s) => s.id === current.id)
    const n = shuffle ? songs[Math.floor(Math.random() * songs.length)] : songs[(i + 1) % songs.length]
    void pick(n)
  }
  const prev = () => {
    if (!songs.length || !current) return
    const i = songs.findIndex((s) => s.id === current.id)
    void pick(songs[(i - 1 + songs.length) % songs.length])
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch {
      // ponytail: browser menolak fullscreen (iframe/permissions)
    }
  }

  const seekBy = (delta) => {
    const a = audio.current
    if (!a || !current) return
    const dur = current.durationMs ? current.durationMs / 1000 : a.duration || 0
    a.currentTime = Math.min(Math.max(0, a.currentTime + delta), dur || 0)
  }

  const bumpVolume = (delta) => {
    const v = Math.min(1, Math.max(0, Math.round((volume + delta) * 100) / 100))
    setVol(v)
    setVolume(v)
  }

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.code === 'Space') {
        e.preventDefault()
        void toggle()
      } else if (e.key === 'f' || e.key === 'F') {
        void toggleFullscreen()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekBy(-5)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekBy(5)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        bumpVolume(0.1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        bumpVolume(-0.1)
      }
    }
    window.addEventListener('keydown', onKey)
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
    }
  })

const onUpload = async (e) => {
     await resumeAudioContext()
     const raw = [...(e.target.files ?? [])]
     e.target.value = ''
     if (!raw.length) return
     
     // Separate LRC and audio files using robust mobile-compatible check (isAudioName + MIME fallback)
     const lrcFiles = raw.filter(f => f.name.toLowerCase().endsWith('.lrc'))
     const audioFiles = raw.filter(f => {
       if (f.name.toLowerCase().endsWith('.lrc')) return false
       const validExt = isAudioName(f.name)
       const validMime = !f.type || f.type.startsWith('audio/') || f.type === 'application/octet-stream' || f.type === 'application/x-flac' || f.type === 'video/webm'
       return (validExt || validMime) && f.size > 0
     })
     
     if (!audioFiles.length && !lrcFiles.length) return
     
     setLoading(true)
     setIsScanning(true)
     const existing = new Set((await db.songs.toArray()).map((s) => `${s.fileName}|${s.audioKey}`))
     const existingNames = new Set((await db.songs.toArray()).map((s) => s.fileName))
     const lrcByName = new Map(lrcFiles.map(f => [f.name.replace(/\.lrc$/i, '').toLowerCase(), f]))
     
     // We only process audioFiles; LRCs are attached later by matching base name
      const queue = audioFiles
      try {
      setUploadProgress({ active: true, done: 0, total: queue.length, current: '', failed: 0 })

      const yieldFrame = () => new Promise((r) => setTimeout(r, 16))

      for (const file of queue) {
        if (existingNames.has(file.name)) {
          setUploadProgress((s) => ({ ...s, done: s.done + 1, current: file.name }))
          continue
        }
         existingNames.add(file.name)
         let blobUrl = ''
         let bufferedBlob = null
         try {
           if (!(file instanceof Blob) || !file.size) throw new Error('Invalid file blob')
           console.log('[Upload] Buffering file into ArrayBuffer:', file.name, file.size)
           const arrayBuffer = await file.arrayBuffer()
           bufferedBlob = new Blob([arrayBuffer], { type: file.type || 'audio/mpeg' })

           setUploadProgress((s) => ({ ...s, current: file.name }))
            const meta = await withTimeout(parseFile(bufferedBlob, { withCover: true }), 12000)
            const audioKey = `audio-${uid()}`
            console.log('[Upload] Storing audio blob:', audioKey)
            await putBlob(audioKey, bufferedBlob)
            let coverKey = ''
            if (meta.coverBlob && meta.coverKey) {
              coverKey = meta.coverKey
              console.log('[Upload] Storing cover blob:', coverKey)
              await putCover(coverKey, meta.coverBlob)
            }
            blobUrl = URL.createObjectURL(bufferedBlob)
            const durationMs = await withTimeout(durationOf(blobUrl), 8000)
            URL.revokeObjectURL(blobUrl)
            blobUrl = ''
            const lrc = lrcByName.get(file.name.replace(/\.[^.]+$/, '').toLowerCase())
            if (lrc) {
              const lrcBuffer = await lrc.arrayBuffer()
              const bufferedLrc = new Blob([lrcBuffer], { type: 'text/plain' })
              await putBlob(`${audioKey}:lrc`, bufferedLrc)
            }
            const artistId = uid()
            const albumId = uid()
            const saveSong = async () => {
              await db.transaction('rw', db.songs, db.artists, db.albums, async () => {
                if (!(await db.artists.where('name').equals(meta.artist).first())) await db.artists.add({ id: artistId, name: meta.artist })
                const existingAlbum = await db.albums.where('title').equals(meta.album).first()
                if (!existingAlbum) {
                  await db.albums.add({ id: albumId, title: meta.album, artistId, year: meta.year, coverKey })
                } else if (!existingAlbum.coverKey && coverKey) {
                  await db.albums.update(existingAlbum.id, { coverKey })
                }
                await db.songs.add({
                  title: String(meta.title || file.name),
                  artist: String(meta.artist || 'Unknown Artist'),
                  album: String(meta.album || 'Unknown Album'),
                  fileName: file.name,
                  durationMs: Number(durationMs) || 0,
                  audioKey,
                  coverKey,
                  genre: meta.genre || '',
                  year: Number(meta.year) || 0,
                  format: meta.format || '',
                  sampleRate: meta.sampleRate || null,
                  bitDepth: meta.bitDepth || null
                })
              })
            }
            try {
              await saveSong()
            } catch (dbErr) {
              console.error('[DB SAVE ERROR]', dbErr?.name, dbErr)
              throw dbErr
            }
         } catch (err) {
          if (err?.name === 'QuotaExceededError') console.error('[QUOTA] IndexedDB penuh, skip:', file.name, err)
          else if (err?.name === 'DataError') console.error('[DATA] Record invalid, skip:', file.name, err)
          else console.error('Upload failed for', file.name, err)
          if (blobUrl) URL.revokeObjectURL(blobUrl)
          setUploadProgress((s) => ({ ...s, failed: s.failed + 1 }))
        }
        setUploadProgress((s) => ({ ...s, done: s.done + 1 }))
        await refresh()
        await yieldFrame()
      }
     } finally {
       setUploadProgress({ active: false, done: queue.length, total: queue.length, current: '' })
       const allSongs = await db.songs.toArray()
       setSongs(allSongs)
       await refresh()
       setLoading(false)
       setIsScanning(false)
     }
   }

  const onDirectToggle = () => {
    const newDirect = !direct
    setDirectMode(newDirect)
    if (current) {
      void pick(current)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-950">
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <main className="col-span-12 md:col-span-7 xl:col-span-8 h-full overflow-y-auto p-3 md:p-6 min-h-0 flex flex-col gap-3">
          <header className="flex items-center gap-3">
            <img src={logoSlug} alt="Justify logo" width="44" height="44" loading="eager" className="h-11 w-11 shrink-0 rounded-2xl object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold leading-none">Justify</h1>
              <p className="text-xs text-zinc-400">Offline Music Player • {songs.length} lagu</p>
            </div>
            {current && (
              <div className="ml-auto flex items-center gap-2 md:hidden">
                <img src={current.coverUrl || FALLBACK_COVER} alt="" className="h-11 w-11 rounded-xl object-cover" />
              </div>
            )}
          </header>
          <LibraryPanel songs={songs} playlists={playlists} tab={tab} setTab={setTab} onPick={pick} onUpload={() => fileRef.current?.click()} onUploadFolder={() => folderRef.current?.click()} loading={loading} uploadProgress={uploadProgress} />
        </main>
        <div className="hidden md:block md:col-span-5 xl:col-span-4 h-full min-h-0 border-l border-white/10 overflow-y-auto">
          <RightPanel current={current} playing={playing} lyricLines={lyricLines} time={progress} direct={direct} />
        </div>
      </div>
      <div className="md:hidden">
        {current && (
          <div onClick={toggleFullscreen} className="glass mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl p-2.5 text-left active:bg-white/10 cursor-pointer shadow-lg shadow-black/40">
            <img src={current.coverUrl || FALLBACK_COVER} alt="" className="h-11 w-11 rounded-xl object-cover shadow" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{current.title}</span>
              <span className="block truncate text-xs text-zinc-400">{current.artist}</span>
            </span>
            <button onClick={(e) => { e.stopPropagation(); toggle() }} aria-label={playing ? 'Jeda' : 'Putar'} className="touch-target flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95">
              {playing ? <span className="font-bold text-base">❚❚</span> : <span className="font-bold text-base ml-0.5">▶</span>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); next() }} aria-label="Berikutnya" className="touch-target flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
      <audio ref={audio} preload="auto" />
      <input ref={fileRef} type="file" accept={ACCEPT_AUDIO} multiple hidden onChange={onUpload} />
      <input ref={folderRef} type="file" accept={ACCEPT_AUDIO} webkitdirectory="" directory="" multiple hidden onChange={onUpload} />
      <div className="shrink-0 relative z-30 border-t border-white/10 bg-zinc-900/80 backdrop-blur-xl hidden md:block">
      <PlayerBar
        current={current ? { ...current, durationSec: (current.durationMs || 0) / 1000 } : null}
        playing={playing}
        progress={progress}
        volume={volume}
        shuffle={shuffle}
        repeat={repeat}
        onToggle={toggle}
        onNext={next}
        onPrev={prev}
        onSeek={(v) => { if (audio.current) audio.current.currentTime = v; setProgress(v) }}
        onVolume={(v) => { setVol(v); setVolume(v) }}
        onShuffle={() => setShuffle(!shuffle)}
        onRepeat={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
        onDirectToggle={onDirectToggle}
        onFullscreenToggle={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
      </div>
      <BottomNav tab={tab} setTab={setTab} />
      {isFullscreen && (
        <div role="dialog" aria-modal="true" aria-label="Mode fullscreen" className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/90">
          <img
            src={current?.coverUrl || logoSlug}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-150 object-cover blur-3xl saturate-200 opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-zinc-950/20" />
          <button onClick={toggleFullscreen} aria-label="Keluar fullscreen" className="touch-target fixed right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:bg-white/25">
            <Minimize2 size={20} />
          </button>
          <div className="scroll-thin relative z-10 mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto px-6 pb-6 pt-2 md:hidden">
            <div className="mx-auto my-3 h-1 w-9 rounded-full bg-white/30" aria-hidden="true" />
            <div className="relative mt-2">
              <img
                src={current?.coverUrl || logoSlug}
                alt={current ? `Cover ${current.album}` : 'Cover default'}
                className="aspect-square w-full rounded-3xl object-cover shadow-2xl shadow-black/80"
              />
            </div>
            <div className="pointer-events-none -mt-12 h-12 bg-gradient-to-b from-transparent via-zinc-950/70 to-zinc-950" aria-hidden="true" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-white">{current?.title ?? 'Justify'}</p>
                <p className="truncate text-sm text-zinc-400">{current ? `${current.artist} — ${current.album}` : 'PWA Offline Music Player'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button aria-label="Favorit" className="touch-target flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95">
                  <Star size={18} />
                </button>
                <button aria-label="Opsi" className="touch-target flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="range" min={0} max={current?.durationMs ? current.durationMs / 1000 : 0} step={0.5} value={progress}
                onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); setProgress(Number(e.target.value)) }}
                aria-label="Posisi lagu" className="seek"
                style={{ '--fill': `${((progress / (current?.durationMs ? current.durationMs / 1000 : 1)) * 100).toFixed(1)}%` }}
              />
              <div className="flex items-center justify-between text-xs tabular-nums text-white/60">
                <span>{formatTime(progress)}</span>
                <span>{current?.durationMs ? `-${formatTime(Math.max(0, current.durationMs / 1000 - progress))}` : formatTime(0)}</span>
              </div>
              <p className="mt-1 text-center text-[11px] tracking-wide text-white/50">
                {direct && current ? `HI-RES ${current.bitDepth ? `${current.bitDepth}-bit` : ''} ${formatRate(current.sampleRate)} ${current.format || ''}`.trim() : current?.format ? `${current.format} • Lossless` : 'Lossless'}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-around">
              <button aria-label="Sebelumnya" onClick={prev} disabled={!current} className="touch-target flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40">
                <SkipBack size={32} fill="currentColor" />
              </button>
              <button aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle} disabled={!current} className="touch-target flex h-16 w-16 items-center justify-center rounded-full text-white transition hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40">
                {playing ? <Pause size={44} fill="currentColor" /> : <Play size={44} fill="currentColor" className="ml-1" />}
              </button>
              <button aria-label="Berikutnya" onClick={next} disabled={!current} className="touch-target flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40">
                <SkipForward size={32} fill="currentColor" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <VolumeX size={18} className="shrink-0 text-white/60" />
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => { setVol(Number(e.target.value)); setVolume(Number(e.target.value)) }} aria-label="Volume" className="h-8 flex-1 cursor-pointer accent-white" />
              <Volume2 size={20} className="shrink-0 text-white/60" />
            </div>
            <div className="mt-6">
              <LyricsPanel lines={lyricLines} time={progress} variant="fullscreen" />
            </div>
            <div className="mt-auto flex items-center justify-around pt-6 text-white/60">
              <button aria-label="Lirik" className="touch-target flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white active:scale-95">
                <Quote size={20} />
              </button>
              <button aria-label="Output audio" className="touch-target flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white active:scale-95">
                <Cast size={20} />
              </button>
              <button aria-label="Antrean" className="touch-target flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white active:scale-95">
                <ListMusic size={20} />
              </button>
            </div>
            <div className="mx-auto mt-4 h-1 w-32 rounded-full bg-white/40" aria-hidden="true" />
          </div>
          <div className="scroll-thin relative z-10 mx-auto hidden h-full w-full max-w-6xl grid-cols-12 items-center gap-10 overflow-hidden p-10 md:grid">
            <div className="flex flex-col gap-4 md:col-span-5">
              <div className="relative w-full max-w-md self-start">
                <img
                  src={current?.coverUrl || logoSlug}
                  alt={current ? `Cover ${current.album}` : 'Cover default'}
                  className="aspect-square w-full rounded-3xl object-cover shadow-2xl shadow-black/60"
                />
                {direct && current && (
                  <span className="absolute -bottom-3 left-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-violet-400/40 bg-zinc-950/80 px-3 py-1 text-[11px] font-mono text-violet-200 backdrop-blur-md">
                    HI-RES {current.bitDepth ? `${current.bitDepth}-bit` : ''} {formatRate(current.sampleRate)} {current.format || ''}
                  </span>
                )}
              </div>
              <div className="mt-6 text-left">
                <p className="font-display text-2xl font-bold text-white">{current?.title ?? 'Justify'}</p>
                <p className="mt-1 text-sm font-medium text-white/60">{current ? `${current.artist} — ${current.album}` : 'PWA Offline Music Player'}</p>
              </div>
              <div className="w-full max-w-md self-start space-y-2">
                <input
                  type="range" min={0} max={current?.durationMs ? current.durationMs / 1000 : 0} step={0.5} value={progress}
                  onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); setProgress(Number(e.target.value)) }}
                  aria-label="Posisi lagu"
                  className="w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-[2px] [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-track]:h-[2px] [&::-moz-range-track]:bg-white/20 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                  style={{ '--fill': `${((progress / (current?.durationMs ? current.durationMs / 1000 : 1)) * 100).toFixed(1)}%` }}
                />
                <div className="flex items-center justify-between text-[10px] font-medium tabular-nums text-white/50">
                  <span>{formatTime(progress)}</span>
                  <span>-{formatTime(Math.max(0, (current?.durationMs ? current.durationMs / 1000 : 0) - progress))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <button aria-label="Opsi" className="text-white/50 hover:text-white transition p-1">
                    <MoreHorizontal size={18} />
                  </button>
                  <div className="flex items-center gap-5">
                    <button aria-label="Sebelumnya" onClick={prev} disabled={!current} className="text-white/80 hover:text-white transition disabled:opacity-40">
                      <SkipBack size={22} fill="currentColor" />
                    </button>
                    <button aria-label={playing ? 'Jeda' : 'Putar'} onClick={toggle} disabled={!current} className="text-white hover:scale-105 active:scale-95 transition disabled:opacity-40">
                      {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button aria-label="Berikutnya" onClick={next} disabled={!current} className="text-white/80 hover:text-white transition disabled:opacity-40">
                      <SkipForward size={22} fill="currentColor" />
                    </button>
                  </div>
                  <button aria-label="Lirik" className="text-white/50 hover:text-white transition p-1">
                    <MessageSquare size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-2 md:col-span-7 md:h-full md:max-h-[70vh] md:overflow-hidden">
              <LyricsPanel lines={lyricLines} time={progress} variant="fullscreen" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}