import { useEffect, useRef, useState } from 'react'
import { getAnalyser } from '../lib/audio'

export default function Visualizer({ playing, mode = 'bars' }) {
  const ref = useRef(null)
  const [m, setM] = useState(mode)
  useEffect(() => setM(mode), [mode])
  useEffect(() => {
    let raf
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const an = getAnalyser()
      const W = (cv.width = cv.clientWidth * devicePixelRatio)
      const H = (cv.height = cv.clientHeight * devicePixelRatio)
      g.clearRect(0, 0, W, H)
      if (!an || !playing) {
        g.fillStyle = 'rgba(139,92,246,.25)'
        for (let i = 0; i < 48; i++) {
          const h = 4 + Math.abs(Math.sin(Date.now() / 900 + i * 0.4)) * H * 0.12
          g.fillRect((W / 48) * i + 2, H - h, W / 48 - 4, h)
        }
        return
      }
      if (m === 'wave') {
        const d = new Uint8Array(an.fftSize)
        an.getByteTimeDomainData(d)
        g.strokeStyle = '#a78bfa'
        g.lineWidth = 3 * devicePixelRatio
        g.beginPath()
        d.forEach((v, i) => {
          const x = (W / d.length) * i
          const y = ((v - 128) / 128) * (H * 0.4) + H / 2
          i ? g.lineTo(x, y) : g.moveTo(x, y)
        })
        g.stroke()
      } else {
        const d = new Uint8Array(an.frequencyBinCount)
        an.getByteFrequencyData(d)
        const n = 56
        const bw = W / n
        for (let i = 0; i < n; i++) {
          const v = d[Math.floor((i / n) * d.length * 0.75)] / 255
          const h = 4 + v * H * 0.9
          const grad = g.createLinearGradient(0, H - h, 0, H)
          grad.addColorStop(0, '#a78bfa')
          grad.addColorStop(1, '#6d28d9')
          g.fillStyle = grad
          g.beginPath()
          g.roundRect(i * bw + 2, H - h, bw - 4, h, 4)
          g.fill()
        }
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [playing, m])
  return <canvas ref={ref} onClick={() => setM(m === 'bars' ? 'wave' : 'bars')} title="Klik untuk ganti mode" className="h-28 w-full cursor-pointer rounded-2xl bg-black/40 md:h-32" />
}
