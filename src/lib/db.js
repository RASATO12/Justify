import Dexie from 'dexie'

export const db = new Dexie('justify-db')
db.version(1).stores({
  songs: 'id, title, artistId, albumId, genre, year',
  artists: 'id, name',
  albums: 'id, title, artistId, year',
  playlists: 'id, name, createdAt, updatedAt',
  playlist_items: '[playlistId+songId], playlistId, songId, itemOrder',
  blobs: 'key',
  covers: 'key'
})

export const putBlob = async (key, blob) => {
  try {
    return await db.blobs.put({ key, blob })
  } catch (e) {
    console.error('putBlob failed', key, e)
    throw e
  }
}

export const getBlob = async (key) => (await db.blobs.get(key))?.blob

export const putCover = async (key, blob) => {
  try {
    return await db.covers.put({ key, blob })
  } catch (e) {
    console.error('putCover failed', key, e)
    throw e
  }
}
export const getCoverUrl = async (key) => {
  const r = key && (await db.covers.get(key))
  return r ? URL.createObjectURL(r.blob) : ''
}
