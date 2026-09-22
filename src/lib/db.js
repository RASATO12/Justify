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

export const putBlob = async (key, blob) => {
  try {
    if (!(blob instanceof Blob)) throw new Error('Invalid blob')
    return await db.blobs.put({ key, blob })
  } catch (e) {
    console.error('putBlob failed', e?.name, key, e)
    throw e
  }
}

export const getBlob = async (key) => (await db.blobs.get(key))?.blob

export const putCover = async (key, blob) => {
  try {
    if (!(blob instanceof Blob)) throw new Error('Invalid blob')
    return await db.covers.put({ key, blob })
  } catch (e) {
    console.error('putCover failed', e?.name, key, e)
    throw e
  }
}

export const getCoverUrl = async (key) => {
  const r = key && (await db.covers.get(key))
  return r ? URL.createObjectURL(r.blob) : ''
}

export const resetDatabase = async () => {
  await forceResetDatabase()
}
