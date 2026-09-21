import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'
import { uid } from './utils'

const readTagOnce = (blob) =>
  new Promise((resolve) => {
    try {
      jsmediatags.read(blob, { onSuccess: resolve, onError: () => resolve(null) })
    } catch {
      resolve(null)
    }
  })

const readTag = async (file) => {
  const sliced = await readTagOnce(file.slice(0, 131072))
  if (sliced) return sliced
  return readTagOnce(file)
}

export async function probeFile(file) {
  try {
    const buf = await file.slice(0, 4096).arrayBuffer()
    const view = new DataView(buf)
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    if (magic === 'fLaC') {
      let offset = 4
      while (offset < view.byteLength) {
        const header = view.getUint8(offset)
        const isLast = (header & 0x80) !== 0
        const blockType = header & 0x7f
        const len = (view.getUint8(offset + 1) << 16) | (view.getUint8(offset + 2) << 8) | view.getUint8(offset + 3)
        if (blockType === 0) {
          const sr = (view.getUint8(offset + 10) << 12) | (view.getUint8(offset + 11) << 4) | (view.getUint8(offset + 12) >> 4)
          const bd = ((view.getUint8(offset + 12) & 0x0f) << 1) | (view.getUint8(offset + 13) >> 7) + 1
          return { format: 'FLAC', sampleRate: sr, bitDepth: bd, channels: ((view.getUint8(offset + 12) >> 1) & 0x07) + 1 }
        }
        offset += 4 + len
        if (isLast) break
      }
      return { format: 'FLAC', sampleRate: 44100, bitDepth: 16, channels: 2 }
    } else if (magic === 'RIFF') {
      const sub = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
      if (sub === 'WAVE') {
        return { format: 'WAV', sampleRate: view.getUint32(24, true), bitDepth: view.getUint16(34, true), channels: view.getUint16(22, true) }
      }
    }
  } catch {
    // fallback
  }
  const ext = file.name.split('.').pop().toUpperCase()
  return { format: ['ALAC', 'M4A', 'AAC'].includes(ext) ? 'ALAC/AAC' : ext, sampleRate: null, bitDepth: null, channels: 2 }
}

async function downscaleCover(blob, max = 512, q = 0.82) {
  try {
    if (!blob || !blob.type.startsWith('image/')) return blob
    const bitmap = await createImageBitmap(blob)
    let { width, height } = bitmap
    if (width > max || height > max) {
      if (width > height) { height = Math.round((height * max) / width); width = max }
      else { width = Math.round((width * max) / height); height = max }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)
    return await new Promise((res) => canvas.toBlob((b) => res(b || blob), 'image/jpeg', q))
  } catch {
    return blob
  }
}

const withTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])

export async function parseFile(file) {
  const tag = await withTimeout(readTag(file))
  const hiRes = await probeFile(file)
  const t = tag?.tags ?? {}
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  let title = t.title ?? base
  let artist = t.artist ?? 'Unknown Artist'
  if (!t.title && base.includes(' - ')) {
    const [a, ...rest] = base.split(' - ')
    artist = a.trim() || artist
    title = rest.join(' - ').trim() || title
  }
  let coverKey = ''
  let coverUrl = ''
  let coverBlob = null
  const pic = t.picture
  if (pic?.data) {
    const bytes = new Uint8Array(pic.data)
    const rawBlob = new Blob([bytes], { type: pic.format || 'image/jpeg' })
    coverBlob = await downscaleCover(rawBlob)
    coverKey = `cover-${uid()}`
    coverUrl = URL.createObjectURL(coverBlob)
  }
  return {
    title,
    artist,
    album: t.album ?? 'Unknown Album',
    genre: t.genre ?? '',
    year: Number(t.year) || 0,
    coverKey,
    coverUrl,
    coverBlob,
    format: hiRes.format,
    sampleRate: hiRes.sampleRate,
    bitDepth: hiRes.bitDepth
  }
}

export function durationOf(blobUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const a = new Audio()
    let done = false
    const finish = (v) => { if (!done) { done = true; a.src=''; resolve(v) } }
    const t = setTimeout(() => finish(0), timeoutMs)
    a.preload = 'metadata'
    a.onloadedmetadata = () => { clearTimeout(t); finish((a.duration || 0) * 1000) }
    a.onerror = () => { clearTimeout(t); finish(0) }
    a.src = blobUrl
  })
}
