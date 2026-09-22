import Dexie from 'dexie'

export const db = new Dexie('justify-db')

db.version(4).stores({
  songs: '++id, title, artist, album, fileName',
  artists: 'id, name',
  albums: 'id, title, artistId, year',
  playlists: 'id, name, createdAt, updatedAt',
  playlist_items: '[playlistId+songId], playlistId, songId, itemOrder',
  blobs: 'key',
  covers: 'key'
})

// v5: dedicated micro-chunk stores (manifest stays in blobs/covers)
db.version(5).stores({
  songs: '++id, title, artist, album, fileName',
  artists: 'id, name',
  albums: 'id, title, artistId, year',
  playlists: 'id, name, createdAt, updatedAt',
  playlist_items: '[playlistId+songId], playlistId, songId, itemOrder',
  blobs: 'key',
  covers: 'key',
  chunks: 'key',
  cover_chunks: 'key'
})

async function forceResetDatabase() {
  try {
    if (db.isOpen()) {
      db.close()
    }
    await db.delete()
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('justify-db')
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
      req.onblocked = () => resolve(false)
    })
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        await reg.unregister()
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      for (const key of keys) {
        await caches.delete(key)
      }
    }
  } catch (err) {
    console.error('[DB FORCE RESET ERROR]', err)
  } finally {
    window.location.reload()
  }
}

db.open().catch(async (e) => {
  console.error('[DB OPEN ERROR]', e?.name, e)
  if (
    e?.name === 'UpgradeError' ||
    e?.name === 'VersionError' ||
    e?.name === 'DatabaseClosedError' ||
    e?.name === 'OpenFailedError' ||
    e?.name === 'InternalError'
  ) {
    console.warn('[DB RECOVERY] Critical IndexedDB error encountered. Executing forceful reset & cache clear...')
    await forceResetDatabase()
  }
})

const base64ToBlob = async (base64Str, defaultType = 'audio/mpeg') => {
  if (base64Str.startsWith('data:')) {
    const res = await fetch(base64Str)
    return await res.blob()
  }
  const byteCharacters = atob(base64Str)
  const byteArray = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteArray], { type: defaultType })
}

export const putBlob = async (key, blob) => {
  if (!(blob instanceof Blob)) throw new Error('Invalid blob')
  const CHUNK_SIZE = 256 * 1024 // 256KB micro-chunks
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE)

  const existing = await db.blobs.get(key)
  if (existing?.isChunked) {
    for (let i = 0; i < existing.totalChunks; i++) {
      await db.chunks.delete(`${key}_chunk_${i}`).catch(() => {})
      await db.blobs.delete(`${key}_chunk_${i}`).catch(() => {})
    }
  }

  await db.blobs.put({
    key,
    totalChunks,
    size: blob.size,
    type: blob.type || 'audio/mpeg',
    isChunked: true,
    updatedAt: Date.now()
  })

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, blob.size)
    const chunkBlob = blob.slice(start, end)
    const chunkArrayBuffer = await chunkBlob.arrayBuffer()
    await db.chunks.put({
      key: `${key}_chunk_${i}`,
      data: chunkArrayBuffer
    })
  }
}

export const getBlob = async (key) => {
  if (!key) return null
  try {
    const record = await db.blobs.get(key)
    if (!record) return null
    if (record.isChunked) {
      const chunks = []
      for (let i = 0; i < record.totalChunks; i++) {
        let chunkRecord = await db.chunks.get(`${key}_chunk_${i}`)
        if (!chunkRecord?.data) {
          // fallback to legacy blobs table chunk storage
          chunkRecord = await db.blobs.get(`${key}_chunk_${i}`)
        }
        if (!chunkRecord?.data) throw new Error(`Missing chunk ${i} for ${key}`)
        chunks.push(chunkRecord.data)
      }
      return new Blob(chunks, { type: record.type || 'audio/mpeg' })
    }
    if (record.blob instanceof Blob) return record.blob
    if (typeof record.data === 'string') return await base64ToBlob(record.data, record.type || 'audio/mpeg')
    if (record.data instanceof ArrayBuffer || ArrayBuffer.isView(record.data)) {
      return new Blob([record.data], { type: record.type || 'audio/mpeg' })
    }
    return null
  } catch (err) {
    console.error('getBlob lookup failed', err)
    return null
  }
}

export const putCover = async (key, blob) => {
  if (!(blob instanceof Blob)) throw new Error('Invalid blob')
  const CHUNK_SIZE = 256 * 1024
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE)

  const existing = await db.covers.get(key)
  if (existing?.isChunked) {
    for (let i = 0; i < existing.totalChunks; i++) {
      await db.cover_chunks.delete(`${key}_chunk_${i}`).catch(() => {})
      await db.covers.delete(`${key}_chunk_${i}`).catch(() => {})
    }
  }

  await db.covers.put({
    key,
    totalChunks,
    size: blob.size,
    type: blob.type || 'image/jpeg',
    isChunked: true,
    updatedAt: Date.now()
  })

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, blob.size)
    const chunkBlob = blob.slice(start, end)
    const chunkArrayBuffer = await chunkBlob.arrayBuffer()
    await db.cover_chunks.put({
      key: `${key}_chunk_${i}`,
      data: chunkArrayBuffer
    })
  }
}

async function reconstructChunkedCover(key, record) {
  const chunks = []
  for (let i = 0; i < record.totalChunks; i++) {
    let chunkRecord = await db.cover_chunks.get(`${key}_chunk_${i}`)
    if (!chunkRecord?.data) {
      chunkRecord = await db.covers.get(`${key}_chunk_${i}`)
    }
    if (!chunkRecord?.data) throw new Error(`Missing cover chunk ${i} for ${key}`)
    chunks.push(chunkRecord.data)
  }
  return new Blob(chunks, { type: record.type || 'image/jpeg' })
}

export const getCoverUrl = async (key) => {
  if (!key) return ''
  try {
    const r = await db.covers.get(key)
    if (!r) return ''
    const blob = r.isChunked
      ? await reconstructChunkedCover(key, r)
      : r.blob instanceof Blob
        ? r.blob
        : typeof r.data === 'string'
          ? await base64ToBlob(r.data, r.type || 'image/jpeg')
          : (r.data instanceof ArrayBuffer || ArrayBuffer.isView(r.data))
            ? new Blob([r.data], { type: r.type || 'image/jpeg' })
            : null
    return blob ? URL.createObjectURL(blob) : ''
  } catch {
    return ''
  }
}

export const resetDatabase = async () => {
  await forceResetDatabase()
}
