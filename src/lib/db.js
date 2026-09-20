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

export const putBlob = (key, blob) => db.blobs.put({ key, blob })
export const getBlob = async (key) => (await db.blobs.get(key))?.blob
export const putCover = (key, blob) => db.covers.put({ key, blob })
export const getCoverUrl = async (key) => {
  const r = key && (await db.covers.get(key))
  return r ? URL.createObjectURL(r.blob) : ''
}
