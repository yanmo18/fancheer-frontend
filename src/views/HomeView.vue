<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import MusicPlayer from '@/components/MusicPlayer.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'
import RevealBlock from '@/components/RevealBlock.vue'
import ActivityListItem from '@/components/ActivityListItem.vue'
import AppModal from '@/components/AppModal.vue'
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
import { isDemoItemId } from '@/utils/demoFallback'
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
const previewIndex = ref<number | null>(null)
const galleryScrollRef = ref<HTMLElement | null>(null)

const HOME_ACTIVITY_PREVIEW = 4

const galleryList = computed(() =>
  galleryTab.value === 'anime' ? galleryAnime.value : galleryReal.value,
)

const galleryItemCount = computed(() => galleryList.value.length)

const previewImage = computed(() => {
  if (previewIndex.value === null) return null
  return galleryList.value[previewIndex.value]?.imageUrl ?? null
})

const previewTitle = computed(() => {
  if (previewIndex.value === null) return '图片预览'
  return galleryList.value[previewIndex.value]?.title || '图片预览'
})

const galleryPreviewOpen = computed(() => previewIndex.value !== null)

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

function openPreviewAt(index: number) {
  galleryAutoScroll.pauseFromUser()
  previewIndex.value = index
}

function closePreview() {
  previewIndex.value = null
}

function shiftPreview(delta: number) {
  if (previewIndex.value === null || galleryList.value.length <= 1) return
  const len = galleryList.value.length
  previewIndex.value = (previewIndex.value + delta + len) % len
}

function onLightboxKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
  else if (e.key === 'ArrowLeft') shiftPreview(-1)
  else if (e.key === 'ArrowRight') shiftPreview(1)
}

watch(galleryPreviewOpen, (open) => {
  if (open) document.addEventListener('keydown', onLightboxKeydown)
  else document.removeEventListener('keydown', onLightboxKeydown)
})

onUnmounted(() => document.removeEventListener('keydown', onLightboxKeydown))

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
  const fallbackOpts = { allowFallback: true } as const
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
  const demoSections: string[] = []

  function trackDemo(label: string, items: Array<{ id?: string }>) {
    if (items.some((item) => isDemoItemId(item.id))) {
      demoSections.push(label)
    }
  }

  if (results[0].status === 'fulfilled') {
    const info = results[0].value
    streamer.value = withDemoStreamer(info, fallbackOpts)
    if (!info?.name && streamer.value) demoSections.push(labels[0])
    if (info?.name) {
      setPageMeta({
        title: info.name,
        description: info.bio?.slice(0, 120) || undefined,
        path: '/',
      })
    }
  } else {
    streamer.value = withDemoStreamer(null, fallbackOpts)
    if (streamer.value) demoSections.push(labels[0])
    failed.push(labels[0])
  }

  if (results[1].status === 'fulfilled') {
    banners.value = withDemoBanners(results[1].value, fallbackOpts)
    trackDemo(labels[1], banners.value)
  } else {
    banners.value = withDemoBanners([], fallbackOpts)
    trackDemo(labels[1], banners.value)
    failed.push(labels[1])
  }

  if (results[2].status === 'fulfilled') {
    awards.value = withDemoAwards(results[2].value, fallbackOpts)
    trackDemo(labels[2], awards.value)
  } else {
    awards.value = withDemoAwards([], fallbackOpts)
    trackDemo(labels[2], awards.value)
    failed.push(labels[2])
  }

  if (results[3].status === 'fulfilled') {
    songs.value = withDemoSongs(results[3].value, fallbackOpts)
    trackDemo(labels[3], songs.value)
  } else {
    songs.value = withDemoSongs([], fallbackOpts)
    trackDemo(labels[3], songs.value)
    failed.push(labels[3])
  }

  if (results[4].status === 'fulfilled') {
    activities.value = withDemoActivities(results[4].value, fallbackOpts)
    trackDemo(labels[4], activities.value)
  } else {
    activities.value = withDemoActivities([], fallbackOpts)
    trackDemo(labels[4], activities.value)
    failed.push(labels[4])
  }

  if (results[5].status === 'fulfilled') {
    galleryAnime.value = withDemoGallery(results[5].value, 'anime', fallbackOpts)
    trackDemo(labels[5], galleryAnime.value)
  } else {
    galleryAnime.value = withDemoGallery([], 'anime', fallbackOpts)
    trackDemo(labels[5], galleryAnime.value)
    failed.push(labels[5])
  }

  if (results[6].status === 'fulfilled') {
    galleryReal.value = withDemoGallery(results[6].value, 'real', fallbackOpts)
    trackDemo(labels[6], galleryReal.value)
  } else {
    galleryReal.value = withDemoGallery([], 'real', fallbackOpts)
    trackDemo(labels[6], galleryReal.value)
    failed.push(labels[6])
  }

  if (results[7].status === 'fulfilled') {
    const graph = results[7].value
    graphData.value = withDemoGraph(graph.characters.length ? graph : null, fallbackOpts)
    if (graphData.value?.characters.some((c) => isDemoItemId(c.id))) {
      demoSections.push(labels[7])
    }
  } else {
    graphData.value = withDemoGraph(null, fallbackOpts)
    if (graphData.value) demoSections.push(labels[7])
    failed.push(labels[7])
  }

  galleryTab.value = galleryAnime.value.length ? 'anime' : 'real'

  const warningParts: string[] = []
  if (failed.length) warningParts.push(`接口异常：${failed.join('、')}`)
  const demoOnly = [...new Set(demoSections)]
  if (demoOnly.length) warningParts.push(`演示兜底：${demoOnly.join('、')}`)

  if (failed.length === labels.length) {
    error.value = ''
    loadWarning.value =
      warningParts.join('；') + '。当前首页已尽量展示演示内容，请检查后端服务后刷新。'
  } else if (warningParts.length) {
    loadWarning.value = warningParts.join('；') + '。后台恢复后将自动显示真实数据。'
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
        <div class="gallery-tabs" role="tablist" aria-label="图集分类">
          <button
            type="button"
            role="tab"
            class="gallery-tab"
            :class="{ active: galleryTab === 'anime' }"
            :aria-selected="galleryTab === 'anime'"
            @click="galleryTab = 'anime'"
          >
            二次元
          </button>
          <button
            type="button"
            role="tab"
            class="gallery-tab"
            :class="{ active: galleryTab === 'real' }"
            :aria-selected="galleryTab === 'real'"
            @click="galleryTab = 'real'"
          >
            三次元
          </button>
        </div>
        <p v-if="!galleryList.length" class="muted gallery-empty">暂无{{ galleryTab === 'anime' ? '二次元' : '三次元' }}图集</p>
        <div
          v-else
          class="gallery-scroll-wrapper"
          @mouseenter="galleryAutoScroll.onHoverEnter()"
          @mouseleave="galleryAutoScroll.onHoverLeave()"
          @pointerdown="galleryAutoScroll.pauseFromUser()"
          @wheel="galleryAutoScroll.pauseFromUser()"
        >
          <button type="button" class="gallery-arrow gallery-arrow-left" aria-label="向左滚动" @click="scrollGallery(-1)">‹</button>
          <div ref="galleryScrollRef" class="gallery-scroll gallery-scroll--auto" role="list">
            <div
              v-for="(img, index) in galleryList"
              :key="img.id"
              class="gallery-scroll-item"
              role="listitem"
              tabindex="0"
              :aria-label="img.title ? `查看大图：${img.title}` : '查看大图'"
              @click="openPreviewAt(index)"
              @keydown.enter.prevent="openPreviewAt(index)"
              @keydown.space.prevent="openPreviewAt(index)"
            >
              <img :src="img.imageUrl" :alt="img.title || '图集图片'" />
              <div v-if="img.title" class="gallery-scroll-overlay">
                <span class="gallery-scroll-text">{{ img.title }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="gallery-arrow gallery-arrow-right" aria-label="向右滚动" @click="scrollGallery(1)">›</button>
        </div>
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

      <AppModal
        :open="galleryPreviewOpen"
        variant="lightbox"
        title-id="gallery-preview-title"
        @close="closePreview"
      >
        <div class="gallery-lightbox">
          <span id="gallery-preview-title" class="sr-only">{{ previewTitle }}</span>
          <button type="button" class="lightbox-close" aria-label="关闭预览" @click.stop="closePreview">×</button>
          <button
            v-if="galleryList.length > 1"
            type="button"
            class="lightbox-nav lightbox-prev"
            aria-label="上一张"
            @click.stop="shiftPreview(-1)"
          >
            ‹
          </button>
          <img v-if="previewImage" :src="previewImage" :alt="previewTitle" @click.stop />
          <button
            v-if="galleryList.length > 1"
            type="button"
            class="lightbox-nav lightbox-next"
            aria-label="下一张"
            @click.stop="shiftPreview(1)"
          >
            ›
          </button>
        </div>
      </AppModal>
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

.gallery-empty {
  text-align: center;
  padding: 1.5rem 0;
}

.gallery-scroll-item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.gallery-lightbox {
  position: relative;
  max-width: min(100%, 960px);
}

.gallery-lightbox img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.lightbox-close,
.lightbox-nav {
  position: absolute;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  cursor: pointer;
  border-radius: 999px;
  display: grid;
  place-items: center;
  z-index: 1;
}

.lightbox-close {
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  line-height: 1;
}

.lightbox-nav {
  top: 50%;
  transform: translateY(-50%);
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1.75rem;
}

.lightbox-prev {
  left: 1rem;
}

.lightbox-next {
  right: 1rem;
}
</style>
