let directMode = false

export function isDirectMode() {
  return directMode
}

export function setDirectMode(b) {
  directMode = b
}

let ctx, src, analyser, gain, el

export function getAnalyser() {
  if (directMode) return null
  return analyser
}

export async function resumeAudioContext() {
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume()
  }
}

export function ensureEngine(audioEl) {
  el = audioEl
  if (directMode) {
    return null
  }
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return { ctx, analyser, gain }
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') void ctx.resume()
  src = ctx.createMediaElementSource(el)
  analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.82
  gain = ctx.createGain()
  src.connect(analyser)
  analyser.connect(gain)
  gain.connect(ctx.destination)
  return { ctx, analyser, gain }
}

export function setVolume(v) {
  if (el) el.volume = v
}
