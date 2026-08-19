/** 本地 public/assets 演示素材（博主形象） */
export const ASSET_BASE = '/assets'

export const demoHeader = `${ASSET_BASE}/header.jpg`

export function demoPicture(n: number) {
  return `${ASSET_BASE}/picture-${String(n).padStart(2, '0')}.jpg`
}

/** 3D / 二次元形象 */
export const DEMO_ANIME_PICTURES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17] as const

/** 实拍 / 三次元 */
export const DEMO_REAL_ITEMS = [
  { url: demoHeader, title: '日常随拍' },
  { url: demoPicture(14), title: '午后时光' },
  { url: demoPicture(15), title: '街拍记录' },
  { url: demoPicture(10), title: '舞台幕后' },
  { url: demoPicture(12), title: '旅行片段' },
  { url: demoPicture(17), title: '光影瞬间' },
] as const

export const DEMO_STREAMER_AVATAR = demoPicture(1)

export const DEMO_BANNER_IMAGES = [demoHeader, demoPicture(8), demoPicture(2), demoPicture(11)] as const

export const DEMO_SONG_COVERS = [demoPicture(10), demoPicture(3), demoPicture(6)] as const

export const DEMO_ACTIVITY_COVERS = [demoPicture(8), demoPicture(5), demoHeader] as const

export const DEMO_AWARD_IMAGES = [demoPicture(11), demoPicture(9), demoPicture(16)] as const

export const DEMO_GRAPH_AVATARS = [demoPicture(1), demoPicture(16), demoHeader] as const
