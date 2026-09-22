export const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
export const formatTime = (s = 0) => {
  s = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export const ACCEPT_AUDIO = 'audio/*,audio/mpeg,audio/mp4,audio/flac,audio/x-m4a,audio/aac,audio/wav,audio/ogg,audio/opus,audio/webm,.mp3,.m4a,.flac,.aac,.wav,.ogg,.oga,.opus,.alac,.m4b,.wma,.aiff,.aif,.webm'
export const isAudioName = (n = '') => /\.(mp3|m4a|flac|aac|wav|ogg|oga|opus|alac|m4b|wma|aiff?|webm)$/i.test(n)
export const FALLBACK_COVER = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80'
export const debounce = (fn, ms = 200) => {
  let t
  return (...a) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...a), ms)
  }
}
export const formatRate = (sr) => {
  if (!sr) return ''
  const khz = sr / 1000
  return Number.isInteger(khz) ? `${khz}kHz` : `${khz.toFixed(1)}kHz`
}
