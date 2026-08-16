<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'
import * as publicApi from '@/api/public'
import { setPageMeta } from '@/utils/seo'
import { formatActivityRange, getActivityStatus } from '@/utils/activity'
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
const showAllActivities = ref(false)

const galleryList = computed(() =>
  galleryTab.value === 'anime' ? galleryAnime.value : galleryReal.value,
)

const visibleActivities = computed(() =>
  showAllActivities.value ? activities.value : activities.value.slice(0, 5),
)

const identityTags = computed(() => {
  const tags = streamer.value?.tags
  if (!tags) return []
  return Array.isArray(tags) ? tags : [tags]
})

function openPreview(url: string) {
  previewImage.value = url
}

function closePreview() {
  previewImage.value = null
}

function scrollGallery(dir: number) {
  galleryScrollRef.value?.scrollBy({ left: dir * 480, behavior: 'smooth' })
}

function activityDateParts(iso: string) {
  const d = new Date(iso)
  return { month: `${d.getMonth() + 1}月`, day: String(d.getDate()) }
}

function activityRowClass(index: number, act: ActivityItem) {
  if (showAllActivities.value) return ''
  const status = getActivityStatus(act.startTime, act.endTime).tone
  if (status === 'ended' && index >= 3) return index === 3 ? 'faded' : 'faded-2'
  return ''
}

function badgeClass(tone: string) {
  if (tone === 'ongoing') return 'ongoing'
  if (tone === 'upcoming') return 'upcoming'
  return 'ended'
}

function formatAwardDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    const [info, bannerList, awardList, songList, activityList, anime, real, graph] = await Promise.all([
      publicApi.getStreamerInfo(),
      publicApi.getBanners(),
      publicApi.getAwards(),
      publicApi.getSongs(),
      publicApi.getActivities(),
      publicApi.getGallery('anime'),
      publicApi.getGallery('real'),
      publicApi.getGraph(),
    ])
    streamer.value = info
    banners.value = bannerList
    awards.value = awardList
    songs.value = songList
    activities.value = activityList
    galleryAnime.value = anime
    galleryReal.value = real
    graphData.value = graph.characters.length ? graph : null
    galleryTab.value = anime.length ? 'anime' : 'real'
    if (info.name) {
      setPageMeta({
        title: info.name,
        description: info.bio?.slice(0, 120) || undefined,
        path: '/',
      })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home-page">
    <p v-if="loading" class="state">加载中...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <template v-else>
      <BannerCarousel v-if="banners.length" :banners="banners" />

      <section v-if="streamer" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">ABOUT</div>
            <div class="section-title">关于{{ streamer.name }}</div>
            <div class="section-line" />
          </div>
        </div>

        <div class="profile-card">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar">
              <div class="profile-avatar-inner">
                <img v-if="streamer.avatarUrl" :src="streamer.avatarUrl" alt="" class="profile-avatar-img" />
                <span v-else>🐱</span>
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
            <div class="award-icon">{{ ['🏆', '🎵', '⭐', '🎨'][i % 4] }}</div>
            <div class="award-info">
              <div class="award-name">{{ award.title }}</div>
              <div class="award-date">
                {{ formatAwardDate(award.awardDate) }}
                <template v-if="award.description"> · {{ award.description }}</template>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="songs.length" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">MUSIC</div>
            <div class="section-title">音乐作品</div>
            <div class="section-line" />
          </div>
        </div>
        <MusicPlayer :songs="songs" :streamer-name="streamer?.name" />
      </section>

      <section v-if="galleryAnime.length || galleryReal.length" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">GALLERY</div>
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
        <div v-if="galleryList.length" class="gallery-scroll-wrapper">
          <button type="button" class="gallery-arrow gallery-arrow-left" @click="scrollGallery(-1)">‹</button>
          <div ref="galleryScrollRef" class="gallery-scroll">
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
      </section>

      <section v-if="activities.length" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">EVENTS</div>
            <div class="section-title">活动日历</div>
            <div class="section-line" />
          </div>
        </div>
        <div class="activity-list-wrapper">
          <div class="activity-list">
            <article
              v-for="(act, index) in visibleActivities"
              :key="act.id"
              class="activity-item"
              :class="activityRowClass(index, act)"
            >
              <div class="activity-date">
                <div class="activity-date-month">{{ activityDateParts(act.startTime).month }}</div>
                <div class="activity-date-day">{{ activityDateParts(act.startTime).day }}</div>
              </div>
              <div class="activity-body">
                <div class="activity-title">{{ act.title }}</div>
                <div class="activity-desc">
                  {{ act.description || formatActivityRange(act.startTime, act.endTime) }}
                </div>
              </div>
              <div
                class="activity-badge"
                :class="badgeClass(getActivityStatus(act.startTime, act.endTime).tone)"
              >
                {{ getActivityStatus(act.startTime, act.endTime).label }}
              </div>
            </article>
          </div>
          <div v-if="!showAllActivities && activities.length > 5" class="activity-fade-overlay" />
        </div>
        <button
          v-if="activities.length > 5 && !showAllActivities"
          type="button"
          class="activity-view-all-btn"
          @click="showAllActivities = true"
        >
          查看全部活动 →
        </button>
      </section>

      <section v-if="graphData" class="section">
        <div class="section-header">
          <div>
            <div class="section-label">NETWORK</div>
            <div class="section-title">关系图谱</div>
            <div class="section-line" />
          </div>
        </div>
        <GraphViewer :data="graphData" />
      </section>

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

@media (max-width: 900px) {
  .awards-row {
    flex-direction: column;
  }
}
</style>
