import { FALLBACK_COVER, formatRate } from '../lib/utils'
import LyricsPanel from './LyricsPanel'
import Visualizer from './Visualizer'

export default function RightPanel({ current, playing, lyricLines, time, direct }) {
  return (
    <aside className="scroll-thin flex min-h-0 h-full w-full flex-col gap-4 overflow-y-auto bg-white/[.02] p-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <img src={current?.coverUrl || FALLBACK_COVER} alt={current ? `Cover ${current.album}` : 'Cover default'} className="aspect-square w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="font-display truncate text-lg font-bold">{current?.title ?? 'Justify'}</p>
          <p className="truncate text-sm text-zinc-300">{current ? `${current.artist} — ${current.album}` : 'PWA Offline Music Player'}</p>
          {direct && current && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-600/30 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              HI-RES • BIT-DIRECT {current.bitDepth ? `${current.bitDepth}-bit` : ''} {formatRate(current.sampleRate)} {current.format || 'FLAC'}
            </div>
          )}
        </div>
      </div>
      <Visualizer playing={playing} />
      {direct && <p className="text-center text-xs text-zinc-500">Visualizer di-bypass pada Bit-Direct Mode</p>}
      <div>
        <h2 className="font-display mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">Lirik Sync</h2>
        <LyricsPanel lines={lyricLines} time={time} />
      </div>
    </aside>
  )
}
