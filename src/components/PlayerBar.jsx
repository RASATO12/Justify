import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, Maximize2, Minimize2, AudioWaveform } from 'lucide-react'
import { formatTime, formatRate } from '../lib/utils'
import { isDirectMode, setDirectMode } from '../lib/audio'

const Btn = ({ label, onClick, children, active, disabled, className = '' }) => (
  <button
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={`touch-target flex h-11 w-11 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300 disabled:pointer-events-none disabled:opacity-40 ${active ? 'bg-violet-600 text-white' : 'text-zinc-200 hover:bg-white/10 active:bg-white/20'} ${className}`}
  >
    {children}
  </button>
)

export default function PlayerBar({
  current,
  playing,
  progress,
  volume,
  shuffle,
  repeat,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onVolume,
  onShuffle,
  onRepeat,
  onDirectToggle,
  onFullscreenToggle,
  isFullscreen
}) {
  const direct = isDirectMode()
  return (
    <footer className="flex h-full flex-col justify-center px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 md:px-5">
      <input
        type="range"
        min={0}
        max={current?.durationSec || 0}
        step={0.5}
        value={progress}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Posisi lagu"
        className="seek"
        style={{ '--fill': `${((progress / (current?.durationSec || 1)) * 100).toFixed(1)}%` }}
      />
      <div className="flex items-center gap-1 md:gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{current?.title ?? 'Belum ada lagu'}</p>
          <p className="truncate text-xs text-zinc-400">
            {current
              ? `${current.artist} • ${formatTime(progress)} / ${formatTime(current.durationSec)}`
              : 'Upload musik untuk mulai'}
          </p>
          {direct && current && (
            <span className="inline-flex items-center gap-1 mt-0.5 rounded-full border border-violet-400/30 bg-violet-600/20 px-2 py-0.5 text-[10px] font-mono text-violet-300">
              BIT-DIRECT {current.bitDepth ? `${current.bitDepth}-bit` : ''} {formatRate(current.sampleRate)} {current.format || 'FLAC'}
            </span>
          )}
        </div>
        <Btn label="Acak" onClick={onShuffle} active={shuffle} className="hidden md:flex">
          <Shuffle size={19} />
        </Btn>
        <Btn label="Sebelumnya" onClick={onPrev} disabled={!current}>
          <SkipBack size={20} />
        </Btn>
        <button
          aria-label={playing ? 'Jeda' : 'Putar'}
          onClick={onToggle}
          disabled={!current}
          className="touch-target flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/50 transition hover:bg-violet-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <Btn label="Berikutnya" onClick={onNext} disabled={!current}>
          <SkipForward size={20} />
        </Btn>
        <Btn label="Ulangi" onClick={onRepeat} active={repeat !== 'off'} className="hidden md:flex">
          <Repeat size={19} />
        </Btn>
        <Btn
          label={direct ? 'Nonaktifkan Bit-Direct' : 'Aktifkan Bit-Direct'}
          onClick={onDirectToggle}
          active={direct}
          disabled={!current}
          className="hidden md:flex"
        >
          <AudioWaveform size={19} />
        </Btn>
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-zinc-400 hidden sm:flex" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-8 w-24 cursor-pointer accent-violet-500 hidden sm:block"
          />
          <Btn
            label={isFullscreen ? 'Keluar Fullscreen' : 'Masuk Fullscreen'}
            onClick={onFullscreenToggle}
            active={isFullscreen}
          >
            {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </Btn>
        </div>
      </div>
    </footer>
  )
}