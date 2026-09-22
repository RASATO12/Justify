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

db.version(6).stores({
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

db.on('blocked', () => {
  console.warn('[DB BLOCKED] Another tab holds an outdated connection.')
})

db.open().catch(async (e) => {
  console.error('[DB OPEN ERROR]', e?.name, e)
  if (
    e?.name === 'UpgradeError' ||
    e?.name === 'VersionError' ||
    e?.name === 'DatabaseClosedError' ||
    e?.name === 'OpenFailedError' ||
    e?.name === 'InternalError' ||
    e?.name === 'NotFoundError'
  ) {
    console.warn('[DB RECOVERY] Critical IndexedDB error encountered. Resetting database...')
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

// NotFoundError from IndexedDB means the store/connection went stale (DB deleted
// mid-session, mobile eviction). Re-open the connection and retry once.
async function withDbRetry(op) {
  try {
    return await op()
  } catch (err) {
    if (err?.name === 'NotFoundError' || err?.name === 'DatabaseClosedError') {
      console.warn('[DB] stale connection detected, re-opening and retrying')
      db.close()
      await db.open()
      return await op()
    }
    throw err
  }
}

export async function putBlob(key, blob) {
  if (!(blob instanceof Blob)) throw new Error('Invalid blob')
  try {
    await withDbRetry(() => db.blobs.put({ key, data: blob, updatedAt: Date.now() }))
  } catch (err) {
    console.error('[DB Error] Failed to put blob into Dexie:', err)
    throw err
  }
}

export async function getBlob(key) {
  if (!key) return null
  try {
    const record = await withDbRetry(() => db.blobs.get(key))
    if (!record) return null
    if (record.data instanceof Blob) return record.data
    if (record.blob instanceof Blob) return record.blob
    if (typeof record.data === 'string') return await base64ToBlob(record.data, record.type || 'audio/mpeg')
    if (record.data instanceof ArrayBuffer || ArrayBuffer.isView(record.data)) {
      return new Blob([record.data], { type: record.type || 'audio/mpeg' })
    }
    return null
  } catch (err) {
    console.error('[DB Error] Failed to get blob from Dexie:', err)
    return null
  }
}

export async function putCover(key, blob) {
  if (!(blob instanceof Blob)) throw new Error('Invalid blob')
  try {
    await withDbRetry(() => db.covers.put({ key, data: blob, updatedAt: Date.now() }))
  } catch (err) {
    console.error('[DB Error] Failed to put cover into Dexie:', err)
    throw err
  }
}

export const getCoverUrl = async (key) => {
  if (!key) return ''
  try {
    const r = await db.covers.get(key)
    if (!r) return ''
    const blob = r.data instanceof Blob
      ? r.data
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
