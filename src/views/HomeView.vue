<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import MusicPlayer from '@/components/MusicPlayer.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'
import RevealBlock from '@/components/RevealBlock.vue'
import ActivityListItem from '@/components/ActivityListItem.vue'
import { useGalleryAutoScroll } from '@/composables/useGalleryAutoScroll'
import * as publicApi from '@/api/public'
import { setPageMeta } from '@/utils/seo'
import {
  withDemoActivities,
  withDemoAwards,
  withDemoBanners,
  withDemoGallery,
  withDemoGraph,
  withDemoSongs,
  withDemoStreamer,
} from '@/utils/demoContent'
import { getActivityStatus } from '@/utils/activity'
import type {
  ActivityItem,
  AwardItem,
  BannerItem,
  GalleryItem,
  GraphData,
  SongItem,
  StreamerInfo,
} from '@/types/api'

const GraphViewer = defineAsyncComponent(() => import('@/components/GraphViewer.vue'))

const loading = ref(true)
const error = ref('')
const loadWarning = ref('')
const streamer = ref<StreamerInfo | null>(null)
const banners = ref<BannerItem[]>([])
const awards = ref<AwardItem[]>([])
const songs = ref<SongItem[]>([])
const activities = ref<ActivityItem[]>([])
const galleryAnime = ref<GalleryItem[]>([])
const galleryReal = ref<GalleryItem[]>([])
const graphData = ref<GraphData | null>(null)
const galleryTab = ref<'anime' | 'real'>('anime')
const previewImage = ref<string | null>(null)
const galleryScrollRef = ref<HTMLElement | null>(null)

const HOME_ACTIVITY_PREVIEW = 4

const galleryList = computed(() =>
  galleryTab.value === 'anime' ? galleryAnime.value : galleryReal.value,
)

const galleryItemCount = computed(() => galleryList.value.length)

const galleryPreviewOpen = computed(() => !!previewImage.value)

const galleryAutoScroll = useGalleryAutoScroll(galleryScrollRef, {
  itemCount: galleryItemCount,
  paused: galleryPreviewOpen,
})

const previewActivities = computed(() => activities.value.slice(0, HOME_ACTIVITY_PREVIEW))

const hasMoreActivities = computed(() => activities.value.length > HOME_ACTIVITY_PREVIEW)

const activityStats = computed(() => {
  let ongoing = 0
  let upcoming = 0
  let ended = 0
  for (const act of activities.value) {
    const tone = getActivityStatus(act.startTime, act.endTime).tone
    if (tone === 'ongoing') ongoing += 1
    else if (tone === 'upcoming') upcoming += 1
    else ended += 1
  }
  return { total: activities.value.length, ongoing, upcoming, ended }
})

const identityTags = computed(() => {
  const tags = streamer.value?.tags
  if (!tags) return []
  return Array.isArray(tags) ? tags : [tags]
})

function openPreview(url: string) {
  galleryAutoScroll.pauseFromUser()
  previewImage.value = url
}

function closePreview() {
  previewImage.value = null
}

function scrollGallery(dir: number) {
  galleryAutoScroll.pauseFromUser()
  galleryScrollRef.value?.scrollBy({ left: dir * 480, behavior: 'smooth' })
}

watch(galleryTab, async () => {
  await nextTick()
  galleryAutoScroll.resetScroll()
  galleryAutoScroll.start()
})

watch(galleryList, async () => {
  await nextTick()
  galleryAutoScroll.start()
})

function formatAwardDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

onMounted(async () => {
  const labels = ['博主资料', 'Banner', '荣誉', '音乐', '活动', '二次元图集', '真人图集', '关系图谱']
  const results = await Promise.allSettled([
    publicApi.getStreamerInfo(),
    publicApi.getBanners(),
    publicApi.getAwards(),
    publicApi.getSongs(),
    publicApi.getActivities(),
    publicApi.getGallery('anime'),
    publicApi.getGallery('real'),
    publicApi.getGraph(),
  ])

  const failed: string[] = []

  if (results[0].status === 'fulfilled') {
    streamer.value = withDemoStreamer(results[0].value)
    if (results[0].value.name) {
      setPageMeta({
        title: results[0].value.name,
        description: results[0].value.bio?.slice(0, 120) || undefined,
        path: '/',
      })
    }
  } else {
    streamer.value = withDemoStreamer(null)
    failed.push(labels[0])
  }

  if (results[1].status === 'fulfilled') {
    banners.value = withDemoBanners(results[1].value)
  } else {
    banners.value = withDemoBanners([])
    failed.push(labels[1])
  }

  if (results[2].status === 'fulfilled') {
    awards.value = withDemoAwards(results[2].value)
  } else {
    awards.value = withDemoAwards([])
    failed.push(labels[2])
  }

  if (results[3].status === 'fulfilled') {
    songs.value = withDemoSongs(results[3].value)
  } else {
    songs.value = withDemoSongs([])
    failed.push(labels[3])
  }

  if (results[4].status === 'fulfilled') {
    activities.value = withDemoActivities(results[4].value)
  } else {
    activities.value = withDemoActivities([])
    failed.push(labels[4])
  }

  if (results[5].status === 'fulfilled') {
    galleryAnime.value = withDemoGallery(results[5].value, 'anime')
  } else {
    galleryAnime.value = withDemoGallery([], 'anime')
    failed.push(labels[5])
  }

  if (results[6].status === 'fulfilled') {
    galleryReal.value = withDemoGallery(results[6].value, 'real')
  } else {
    galleryReal.value = withDemoGallery([], 'real')
    failed.push(labels[6])
  }

  if (results[7].status === 'fulfilled') {
    const graph = results[7].value
    graphData.value = withDemoGraph(graph.characters.length ? graph : null)
  } else {
    graphData.value = withDemoGraph(null)
    failed.push(labels[7])
  }

  galleryTab.value = galleryAnime.value.length ? 'anime' : 'real'

  if (failed.length === labels.length) {
    error.value = '首页数据加载失败，请稍后刷新'
  } else if (failed.length) {
    loadWarning.value = `部分模块加载失败：${failed.join('、')}`
  }

  loading.value = false
  await nextTick()
  galleryAutoScroll.start()
})
</script>

<template>
  <div class="home-page">
    <p v-if="loading" class="state">加载中...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <template v-else>
      <p v-if="loadWarning" class="state muted">{{ loadWarning }}</p>
      <RevealBlock v-if="banners.length" variant="banner">
        <BannerCarousel :banners="banners" />
      </RevealBlock>

      <RevealBlock v-if="streamer" variant="about" tag="section" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">博主介绍</div>
            <div class="section-title">关于{{ streamer.name }}</div>
            <div class="section-line" />
          </div>
        </div>

        <div class="profile-card">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar">
              <div class="profile-avatar-inner">
                <img v-if="streamer.avatarUrl" :src="streamer.avatarUrl" alt="" class="profile-avatar-img" />
                <span v-else class="avatar-fallback">{{ streamer.name.slice(0, 1) }}</span>
              </div>
            </div>
          </div>
          <div class="profile-info">
            <div class="profile-name">{{ streamer.name }}</div>
            <div v-if="identityTags.length" class="profile-identity">
              <template v-for="(tag, i) in identityTags" :key="tag">
                <span v-if="i > 0" class="profile-identity-dot" />
                <span>{{ tag }}</span>
              </template>
            </div>
            <div class="profile-bio">{{ streamer.bio || '暂无简介' }}</div>
            <div class="profile-meta">
              <div class="profile-meta-item">
                <div class="profile-meta-value">{{ songs.length }}</div>
                <div class="profile-meta-label">音乐作品</div>
              </div>
              <div class="profile-meta-item">
                <div class="profile-meta-value">{{ activities.length }}</div>
                <div class="profile-meta-label">活动记录</div>
              </div>
              <div class="profile-meta-item">
                <div class="profile-meta-value">{{ awards.length }}</div>
                <div class="profile-meta-label">荣誉奖项</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="awards.length" class="awards-row">
          <article v-for="(award, i) in awards" :key="award.id" class="award-card">
            <div class="award-index">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="award-info">
              <div class="award-name">{{ award.title }}</div>
              <div class="award-date">
                {{ formatAwardDate(award.awardDate) }}
                <template v-if="award.description"> · {{ award.description }}</template>
              </div>
            </div>
          </article>
        </div>
      </RevealBlock>

      <RevealBlock v-if="songs.length" variant="music" tag="section" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">原创作品</div>
            <div class="section-title">音乐作品</div>
            <div class="section-line" />
          </div>
        </div>
        <MusicPlayer :songs="songs" :streamer-name="streamer?.name" />
      </RevealBlock>

      <RevealBlock
        v-if="galleryAnime.length || galleryReal.length"
        variant="gallery"
        tag="section"
        class="section"
      >
        <div class="section-header">
          <div>
            <div class="section-label">照片与插画</div>
            <div class="section-title">图集</div>
            <div class="section-line" />
          </div>
        </div>
        <div class="gallery-tabs">
          <button
            type="button"
            class="gallery-tab"
            :class="{ active: galleryTab === 'anime' }"
            @click="galleryTab = 'anime'"
          >
            二次元
          </button>
          <button
            type="button"
            class="gallery-tab"
            :class="{ active: galleryTab === 'real' }"
            @click="galleryTab = 'real'"
          >
            三次元
          </button>
        </div>
        <div
          v-if="galleryList.length"
          class="gallery-scroll-wrapper"
          @mouseenter="galleryAutoScroll.onHoverEnter()"
          @mouseleave="galleryAutoScroll.onHoverLeave()"
          @pointerdown="galleryAutoScroll.pauseFromUser()"
          @wheel="galleryAutoScroll.pauseFromUser()"
        >
          <button type="button" class="gallery-arrow gallery-arrow-left" @click="scrollGallery(-1)">‹</button>
          <div ref="galleryScrollRef" class="gallery-scroll gallery-scroll--auto">
            <div
              v-for="img in galleryList"
              :key="img.id"
              class="gallery-scroll-item"
              @click="openPreview(img.imageUrl)"
            >
              <img :src="img.imageUrl" :alt="img.title || ''" />
              <div v-if="img.title" class="gallery-scroll-overlay">
                <span class="gallery-scroll-text">{{ img.title }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="gallery-arrow gallery-arrow-right" @click="scrollGallery(1)">›</button>
        </div>
        <p v-else class="state">该分类暂无图片</p>
      </RevealBlock>

      <RevealBlock v-if="activities.length" variant="events" tag="section" class="section section-activities">
        <div class="section-header section-header--split">
          <div>
            <div class="section-label">行程记录</div>
            <div class="section-title">活动日历</div>
            <div class="section-line" />
          </div>
          <div class="activity-home-stats" aria-label="活动统计">
            <div class="activity-stat-chip">
              <span class="activity-stat-value">{{ activityStats.total }}</span>
              <span class="activity-stat-label">全部</span>
            </div>
            <div class="activity-stat-chip activity-stat-chip--ongoing">
              <span class="activity-stat-value">{{ activityStats.ongoing }}</span>
              <span class="activity-stat-label">进行中</span>
            </div>
            <div class="activity-stat-chip activity-stat-chip--upcoming">
              <span class="activity-stat-value">{{ activityStats.upcoming }}</span>
              <span class="activity-stat-label">即将开始</span>
            </div>
          </div>
        </div>

        <div class="activity-home-panel">
          <div
            class="activity-list-wrapper"
            :class="{ 'activity-list-wrapper--preview': hasMoreActivities }"
          >
            <div class="activity-list">
              <ActivityListItem
                v-for="act in previewActivities"
                :key="act.id"
                :activity="act"
              />
            </div>
            <div v-if="hasMoreActivities" class="activity-fade-overlay" />
          </div>
          <RouterLink v-if="hasMoreActivities" to="/activities" class="activity-view-all-btn">
            查看全部活动 →
          </RouterLink>
        </div>
      </RevealBlock>

      <RevealBlock v-if="graphData" variant="graph" tag="section" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">人物关系</div>
            <div class="section-title">关系图谱</div>
            <div class="section-line" />
          </div>
        </div>
        <GraphViewer :data="graphData" />
      </RevealBlock>

      <div v-if="previewImage" class="lightbox" @click="closePreview">
        <img :src="previewImage" alt="" @click.stop />
      </div>
    </template>
  </div>
</template>

<style scoped>
.home-page {
  padding-bottom: 3rem;
}

.state {
  padding: 6rem 1.5rem 2rem;
  text-align: center;
  color: var(--text-muted);
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  font-family: 'Noto Serif SC', serif;
  font-size: 3rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.award-index {
  flex-shrink: 0;
  width: 2rem;
  font-family: 'Noto Serif SC', serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent-primary);
  opacity: 0.7;
}

@media (max-width: 900px) {
  .awards-row {
    flex-direction: column;
  }

  .section-header--split {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .activity-home-stats {
    width: 100%;
    justify-content: flex-start;
  }
}

.section-header--split {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.activity-home-panel {
  position: relative;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
  background:
    radial-gradient(circle at top right, rgba(201, 169, 98, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(252, 248, 242, 0.88));
  box-shadow: 0 16px 40px rgba(62, 48, 35, 0.06);
}

.activity-home-stats {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.activity-stat-chip {
  min-width: 4.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 12px;
  text-align: center;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
}

.activity-stat-chip--ongoing {
  border-color: rgba(196, 163, 90, 0.35);
  background: rgba(196, 163, 90, 0.1);
}

.activity-stat-chip--upcoming {
  border-color: rgba(125, 159, 122, 0.35);
  background: rgba(125, 159, 122, 0.1);
}

.activity-stat-value {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--accent-primary);
  line-height: 1.1;
}

.activity-stat-label {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
</style>
