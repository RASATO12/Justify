import { useEffect, useRef } from 'react'
import { MicVocal } from 'lucide-react'
import { activeLyricIndex } from '../lib/lrc'

export default function LyricsPanel({ lines, time, variant }) {
  const wrap = useRef(null)
  const idx = activeLyricIndex(lines, time)
  useEffect(() => {
    wrap.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [idx])
  if (variant === 'fullscreen') {
    if (!lines.length)
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <MicVocal size={32} className="text-white/60" />
          <p className="font-display text-xl font-bold text-white/95">Belum ada lirik</p>
          <p className="max-w-sm text-center text-sm text-white/50">Upload file .lrc dengan nama yang sama seperti lagu untuk lirik tersinkronisasi.</p>
        </div>
      )
    return (
      <div ref={wrap} className="scroll-thin max-h-56 space-y-3 overflow-y-auto md:max-h-[60vh]">
        {lines.map((l, i) => (
          <p
            key={i}
            data-active={i === idx}
            className={`text-2xl font-bold leading-snug transition md:text-3xl ${i === idx ? 'text-white' : 'text-white opacity-40'}`}
          >
            {l.text}
          </p>
        ))}
      </div>
    )
  }
  if (!lines.length)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
        <MicVocal size={28} className="text-violet-300" />
        <p className="font-display font-semibold">Belum ada lirik</p>
        <p className="text-sm text-zinc-400">Upload file .lrc dengan nama yang sama seperti lagu untuk lirik tersinkronisasi.</p>
      </div>
    )
  return (
    <div ref={wrap} className="scroll-thin max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3 md:max-h-72">
      {lines.map((l, i) => (
        <p
          key={i}
          data-active={i === idx}
          className={`rounded-lg px-3 py-2 text-sm transition ${i === idx ? 'bg-violet-600/30 font-semibold text-white' : 'text-zinc-400'}`}
        >
          {l.text}
        </p>
      ))}
    </div>
  )
}
