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
    if ('storage' in navigator && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory()
        await root.removeEntry('audio_files', { recursive: true })
        await root.removeEntry('cover_files', { recursive: true })
      } catch {}
    }
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

// OPFS: exclusive binary storage. Dexie is only used for lightweight text metadata.
async function getOpfsSubDir(subDirName) {
  if (!('storage' in navigator && navigator.storage.getDirectory)) {
    throw new Error('OPFS not supported')
  }
  const root = await navigator.storage.getDirectory()
  return await root.getDirectoryHandle(subDirName, { create: true })
}

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
  // Write strictly to OPFS. Never fall back to Dexie blob storage:
  // Dexie/IndexedDB cannot persist multi-megabyte FLAC binaries on mobile webviews (DataError/IOError).
  const dir = await getOpfsSubDir('audio_files')
  const fileHandle = await dir.getFileHandle(`${key}.audio`, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export const getBlob = async (key) => {
  if (!key) return null
  try {
    const dir = await getOpfsSubDir('audio_files')
    const fileHandle = await dir.getFileHandle(`${key}.audio`, { create: false })
    const file = await fileHandle.getFile()
    if (file && file.size > 0) return file
  } catch {}

  // Read-only legacy Dexie lookup for items imported before OPFS migration
  try {
    const record = await db.blobs.get(key)
    if (!record) return null
    if (record.blob instanceof Blob) return record.blob
    if (typeof record.data === 'string') return await base64ToBlob(record.data, record.type || 'audio/mpeg')
    if (record.isChunked) {
      const chunks = []
      for (let i = 0; i < record.totalChunks; i++) {
        const chunkRecord = await db.blobs.get(`${key}_chunk_${i}`)
        if (!chunkRecord?.data) throw new Error(`Missing chunk ${i} for ${key}`)
        chunks.push(chunkRecord.data)
      }
      return new Blob(chunks, { type: record.type || 'audio/mpeg' })
    }
    if (record.data instanceof ArrayBuffer || ArrayBuffer.isView(record.data)) {
      return new Blob([record.data], { type: record.type || 'audio/mpeg' })
    }
    return null
  } catch (err) {
    console.error('getBlob legacy lookup failed', err)
    return null
  }
}

export const putCover = async (key, blob) => {
  if (!(blob instanceof Blob)) throw new Error('Invalid blob')
  const dir = await getOpfsSubDir('cover_files')
  const fileHandle = await dir.getFileHandle(`${key}.cover`, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export const getCoverUrl = async (key) => {
  if (!key) return ''
  try {
    const dir = await getOpfsSubDir('cover_files')
    const fileHandle = await dir.getFileHandle(`${key}.cover`, { create: false })
    const file = await fileHandle.getFile()
    if (file && file.size > 0) return URL.createObjectURL(file)
  } catch {}

  try {
    const r = await db.covers.get(key)
    if (!r) return ''
    const blob = r.blob instanceof Blob
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
