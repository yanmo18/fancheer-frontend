import {
  DEMO_ANIME_PICTURES,
  DEMO_ACTIVITY_COVERS,
  DEMO_AWARD_IMAGES,
  DEMO_BANNER_IMAGES,
  DEMO_GRAPH_AVATARS,
  DEMO_REAL_ITEMS,
  DEMO_SONG_COVERS,
  DEMO_STREAMER_AVATAR,
  demoPicture,
} from '@/constants/demoAssets'
import { MAX_HOME_BANNERS } from '@/constants/banner'
import type {
  ActivityItem,
  AwardItem,
  BannerItem,
  GalleryItem,
  GraphData,
  SongItem,
  StreamerInfo,
} from '@/types/api'

export function isMissingMediaUrl(url?: string | null) {
  return !url?.trim()
}

function pickByIndex<T>(items: readonly T[], index: number) {
  return items[index % items.length]
}

export function withDemoBanners(banners: BannerItem[]) {
  if (!banners.length) {
    return DEMO_BANNER_IMAGES.slice(0, MAX_HOME_BANNERS).map((imageUrl, index) => ({
      id: `demo-banner-${index + 1}`,
      title: ['欢迎来到 Fancheer', '博主形象展示', '音乐与日常', '创作记录'][index] ?? 'Fancheer',
      imageUrl,
      linkUrl: '/',
      sortOrder: index + 1,
    }))
  }

  return banners.slice(0, MAX_HOME_BANNERS).map((item, index) =>
    isMissingMediaUrl(item.imageUrl)
      ? { ...item, imageUrl: pickByIndex(DEMO_BANNER_IMAGES, index) }
      : item,
  )
}

export function withDemoStreamer(info: StreamerInfo | null): StreamerInfo | null {
  if (!info) return null
  return {
    ...info,
    avatarUrl: isMissingMediaUrl(info.avatarUrl) ? DEMO_STREAMER_AVATAR : info.avatarUrl,
  }
}

export function withDemoAwards(awards: AwardItem[]) {
  return awards.map((item, index) =>
    isMissingMediaUrl(item.imageUrl)
      ? { ...item, imageUrl: pickByIndex(DEMO_AWARD_IMAGES, index) }
      : item,
  )
}

export function withDemoSongs(songs: SongItem[]) {
  return songs.map((item, index) =>
    isMissingMediaUrl(item.coverUrl)
      ? { ...item, coverUrl: pickByIndex(DEMO_SONG_COVERS, index) }
      : item,
  )
}

export function withDemoActivities(activities: ActivityItem[]) {
  return activities.map((item, index) =>
    isMissingMediaUrl(item.coverUrl)
      ? { ...item, coverUrl: pickByIndex(DEMO_ACTIVITY_COVERS, index) }
      : item,
  )
}

export function withDemoGallery(items: GalleryItem[], category: 'anime' | 'real') {
  const pool: GalleryItem[] =
    category === 'anime'
      ? DEMO_ANIME_PICTURES.map((n) => ({
          id: `demo-anime-${n}`,
          category,
          imageUrl: demoPicture(n),
          title: `形象 ${String(n).padStart(2, '0')}`,
        }))
      : DEMO_REAL_ITEMS.map((item, index) => ({
          id: `demo-real-${index + 1}`,
          category,
          imageUrl: item.url,
          title: item.title,
        }))

  // 库里无数据时，使用演示池兜底，避免首页空白
  if (!items.length) return pool

  // 库里有数据时，只替换空 URL 项，不再强行补齐到 demo 池数量
  // 这样前端展示数量与数据库实际数量保持一致
  return items.map((item, index) =>
    isMissingMediaUrl(item.imageUrl)
      ? { ...item, imageUrl: pickByIndex(pool.map((p) => p.imageUrl), index) }
      : item,
  )
}

export function withDemoGraph(graph: GraphData | null): GraphData | null {
  if (!graph?.characters.length) {
    return {
      characters: [
        {
          id: 'demo-center',
          name: 'Fancheer',
          avatarUrl: DEMO_GRAPH_AVATARS[0],
          bio: '博主',
          isCenter: true,
          sortOrder: 1,
        },
        {
          id: 'demo-friend-1',
          name: 'ZHENG',
          avatarUrl: DEMO_GRAPH_AVATARS[1],
          bio: '伙伴',
          isCenter: false,
          sortOrder: 2,
        },
        {
          id: 'demo-friend-2',
          name: '日常',
          avatarUrl: DEMO_GRAPH_AVATARS[2],
          bio: '猫系分身',
          isCenter: false,
          sortOrder: 3,
        },
      ],
      relations: [
        {
          id: 'demo-rel-1',
          fromCharacterId: 'demo-center',
          toCharacterId: 'demo-friend-1',
          relationLabel: '好友',
          sortOrder: 1,
        },
        {
          id: 'demo-rel-2',
          fromCharacterId: 'demo-center',
          toCharacterId: 'demo-friend-2',
          relationLabel: '伙伴',
          sortOrder: 2,
        },
      ],
    }
  }

  const characters = graph.characters.map((item, index) =>
    isMissingMediaUrl(item.avatarUrl)
      ? { ...item, avatarUrl: pickByIndex(DEMO_GRAPH_AVATARS, index) }
      : item,
  )

  return { ...graph, characters }
}
