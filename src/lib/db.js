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

db.open().catch(async (e) => {
  console.error('[DB OPEN ERROR]', e?.name, e)
  if (e?.name === 'UpgradeError' || e?.name === 'VersionError' || e?.name === 'DatabaseClosedError' || e?.name === 'OpenFailedError') {
    console.warn('[DB RECOVERY] Detected corrupted or incompatible schema version. Resetting database...')
    try {
      await db.delete()
      indexedDB.deleteDatabase('justify-db')
      window.location.reload()
    } catch (resetErr) {
      console.error('[DB RECOVERY FAILED]', resetErr)
    }
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
  await db.delete()
  indexedDB.deleteDatabase('justify-db')
  window.location.reload()
}
