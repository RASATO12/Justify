export function parseLRC(text = '') {
  return text
    .split('\n')
    .flatMap((line) => {
      const times = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)]
      const lyric = line.replace(/\[.*?\]/g, '').trim()
      if (!times.length || !lyric) return []
      return times.map((m) => ({ t: Number(m[1]) * 60 + Number(m[2]), text: lyric }))
    })
    .sort((a, b) => a.t - b.t)
}

export function activeLyricIndex(lines, time) {
  let idx = -1
  for (let i = 0; i < lines.length; i++) if (lines[i].t <= time) idx = i
  return idx
}
