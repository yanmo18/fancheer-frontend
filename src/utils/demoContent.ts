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
import { shouldApplyDemoFallback, type DemoFallbackOptions } from '@/utils/demoFallback'

export function isMissingMediaUrl(url?: string | null) {
  return !url?.trim()
}

function pickByIndex<T>(items: readonly T[], index: number) {
  return items[index % items.length]
}

function galleryDemoPool(category: 'anime' | 'real'): GalleryItem[] {
  return category === 'anime'
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
}

export function withDemoBanners(banners: BannerItem[], options?: DemoFallbackOptions) {
  if (!banners.length) {
    if (!shouldApplyDemoFallback(options)) return []
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

export function withDemoStreamer(
  info: StreamerInfo | null,
  options?: DemoFallbackOptions,
): StreamerInfo | null {
  if (!info) {
    if (!shouldApplyDemoFallback(options)) return null
    return {
      name: 'Fancheer',
      avatarUrl: DEMO_STREAMER_AVATAR,
      tags: ['创作', '音乐', '分享'],
      bio: '大家好，这里是 Fancheer 个人展示站。当前为演示内容，后台恢复后将显示真实资料。',
    }
  }
  return {
    ...info,
    avatarUrl: isMissingMediaUrl(info.avatarUrl) ? DEMO_STREAMER_AVATAR : info.avatarUrl,
  }
}

export function withDemoAwards(awards: AwardItem[], options?: DemoFallbackOptions) {
  if (!awards.length) {
    if (!shouldApplyDemoFallback(options)) return []
    return DEMO_AWARD_IMAGES.map((imageUrl, index) => ({
      id: `demo-award-${index + 1}`,
      title: ['年度创作成就', '原创音乐入围', '平台推荐作品'][index] ?? '荣誉展示',
      description: '演示荣誉条目',
      imageUrl,
      awardDate: '2026-01-01',
    }))
  }

  return awards.map((item, index) =>
    isMissingMediaUrl(item.imageUrl)
      ? { ...item, imageUrl: pickByIndex(DEMO_AWARD_IMAGES, index) }
      : item,
  )
}

export function withDemoSongs(songs: SongItem[], options?: DemoFallbackOptions) {
  if (!songs.length) {
    if (!shouldApplyDemoFallback(options)) return []
    return DEMO_SONG_COVERS.map((coverUrl, index) => ({
      id: `demo-song-${index + 1}`,
      title: ['星光闪耀', '梦想起飞', '夏日微风'][index] ?? '演示曲目',
      artist: 'Fancheer',
      audioUrl: '',
      coverUrl,
    }))
  }

  return songs.map((item, index) =>
    isMissingMediaUrl(item.coverUrl)
      ? { ...item, coverUrl: pickByIndex(DEMO_SONG_COVERS, index) }
      : item,
  )
}

export function withDemoActivities(activities: ActivityItem[], options?: DemoFallbackOptions) {
  if (!activities.length) {
    if (!shouldApplyDemoFallback(options)) return []
    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    return DEMO_ACTIVITY_COVERS.map((coverUrl, index) => ({
      id: `demo-activity-${index + 1}`,
      title: ['新年特别企划', '春季创作分享', '读者见面会'][index] ?? '演示活动',
      description: '演示活动内容',
      coverUrl,
      startTime: `${month}-0${index + 1}T20:00:00`,
      endTime: `${month}-1${index + 5}T22:00:00`,
    }))
  }

  return activities.map((item, index) =>
    isMissingMediaUrl(item.coverUrl)
      ? { ...item, coverUrl: pickByIndex(DEMO_ACTIVITY_COVERS, index) }
      : item,
  )
}

/**
 * 有后台数据时严格对齐 DB 条数；API 失败或空库时可回退演示池。
 */
export function withDemoGallery(
  items: GalleryItem[],
  category: 'anime' | 'real',
  options?: DemoFallbackOptions,
) {
  const pool = galleryDemoPool(category)
  const valid = items.filter((item) => !isMissingMediaUrl(item.imageUrl))

  if (valid.length) {
    return valid.map((item, index) =>
      isMissingMediaUrl(item.imageUrl)
        ? { ...item, imageUrl: pickByIndex(pool.map((p) => p.imageUrl), index) }
        : item,
    )
  }

  if (shouldApplyDemoFallback(options)) return pool
  return []
}

export function withDemoGraph(graph: GraphData | null, options?: DemoFallbackOptions) {
  if (!graph?.characters.length) {
    if (!shouldApplyDemoFallback(options)) return null
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
