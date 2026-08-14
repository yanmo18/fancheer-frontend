<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
import * as publicApi from '@/api/public'
import { formatActivityRange, getActivityStatus } from '@/utils/activity'
import type {
  ActivityItem,
  AwardItem,
  BannerItem,
  GalleryItem,
  SongItem,
  StreamerInfo,
} from '@/types/api'

const loading = ref(true)
const error = ref('')
const streamer = ref<StreamerInfo | null>(null)
const banners = ref<BannerItem[]>([])
const awards = ref<AwardItem[]>([])
const songs = ref<SongItem[]>([])
const activities = ref<ActivityItem[]>([])
const galleryAnime = ref<GalleryItem[]>([])
const galleryReal = ref<GalleryItem[]>([])
const galleryTab = ref<'anime' | 'real'>('anime')
const previewImage = ref<string | null>(null)

const galleryList = computed(() =>
  galleryTab.value === 'anime' ? galleryAnime.value : galleryReal.value,
)

function openPreview(url: string) {
  previewImage.value = url
}

function closePreview() {
  previewImage.value = null
}

onMounted(async () => {
  try {
    const [info, bannerList, awardList, songList, activityList, anime, real] = await Promise.all([
      publicApi.getStreamerInfo(),
      publicApi.getBanners(),
      publicApi.getAwards(),
      publicApi.getSongs(),
      publicApi.getActivities(),
      publicApi.getGallery('anime'),
      publicApi.getGallery('real'),
    ])
    streamer.value = info
    banners.value = bannerList
    awards.value = awardList
    songs.value = songList
    activities.value = activityList
    galleryAnime.value = anime
    galleryReal.value = real
    galleryTab.value = anime.length ? 'anime' : 'real'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <p v-if="loading" class="state muted">加载中...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <template v-else>
      <section v-if="banners.length" class="banner-hero">
        <div class="banner-track">
          <a
            v-for="item in banners"
            :key="item.id"
            :href="item.linkUrl || '#'"
            class="banner-slide"
          >
            <img :src="item.imageUrl" :alt="item.title" />
            <div class="banner-caption">
              <span>{{ item.title }}</span>
            </div>
          </a>
        </div>
      </section>

      <section v-if="streamer" class="hero">
        <div class="hero-inner card">
          <img v-if="streamer.avatarUrl" :src="streamer.avatarUrl" alt="" class="avatar" />
          <div class="hero-text">
            <p class="eyebrow">博主个人展示站</p>
            <h1>{{ streamer.name }}</h1>
            <p v-if="streamer.tags?.length" class="tags">
              {{ Array.isArray(streamer.tags) ? streamer.tags.join(' · ') : streamer.tags }}
            </p>
            <p class="bio">{{ streamer.bio }}</p>
          </div>
        </div>
      </section>

      <section v-if="songs.length" class="section">
        <div class="section-head">
          <h2>音乐</h2>
          <span class="count">{{ songs.length }} 首</span>
        </div>
        <MusicPlayer :songs="songs" />
      </section>

      <section v-if="awards.length" class="section">
        <div class="section-head">
          <h2>荣誉</h2>
        </div>
        <div class="grid">
          <article v-for="award in awards" :key="award.id" class="card item">
            <img v-if="award.imageUrl" :src="award.imageUrl" alt="" class="thumb" />
            <div class="item-body">
              <strong>{{ award.title }}</strong>
              <p class="muted">{{ award.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="activities.length" class="section">
        <div class="section-head">
          <h2>活动</h2>
        </div>
        <div class="grid">
          <article v-for="act in activities" :key="act.id" class="card item">
            <img v-if="act.coverUrl" :src="act.coverUrl" alt="" class="thumb wide" />
            <div class="item-body">
              <div class="act-head">
                <strong>{{ act.title }}</strong>
                <span
                  class="status"
                  :class="getActivityStatus(act.startTime, act.endTime).tone"
                >
                  {{ getActivityStatus(act.startTime, act.endTime).label }}
                </span>
              </div>
              <p class="time muted">{{ formatActivityRange(act.startTime, act.endTime) }}</p>
              <p v-if="act.description" class="muted">{{ act.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="galleryAnime.length || galleryReal.length" class="section">
        <div class="section-head">
          <h2>图集</h2>
          <div class="gallery-tabs">
            <button
              type="button"
              class="gallery-tab"
              :class="{ active: galleryTab === 'anime' }"
              @click="galleryTab = 'anime'"
            >
              二次元
              <span v-if="galleryAnime.length" class="count">{{ galleryAnime.length }}</span>
            </button>
            <button
              type="button"
              class="gallery-tab"
              :class="{ active: galleryTab === 'real' }"
              @click="galleryTab = 'real'"
            >
              真人
              <span v-if="galleryReal.length" class="count">{{ galleryReal.length }}</span>
            </button>
          </div>
        </div>
        <div v-if="galleryList.length" class="gallery-grid">
          <figure v-for="img in galleryList" :key="img.id">
            <button type="button" class="img-btn" @click="openPreview(img.imageUrl)">
              <img :src="img.imageUrl" :alt="img.title || ''" />
            </button>
            <figcaption v-if="img.title">{{ img.title }}</figcaption>
          </figure>
        </div>
        <p v-else class="muted empty-gallery">该分类暂无图片</p>
      </section>

      <div v-if="previewImage" class="lightbox" @click="closePreview">
        <img :src="previewImage" alt="" @click.stop />
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding-bottom: 2rem;
}

.state {
  text-align: center;
  padding: 3rem 1rem;
}

.banner-hero {
  margin: -0.875rem -1.5rem 1.5rem;
  background: linear-gradient(180deg, #eef2ff 0%, var(--bg) 100%);
  padding: 1rem 0 1.5rem;
}

.banner-track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0 1.5rem 0.5rem;
  scrollbar-width: thin;
}

.banner-slide {
  flex: 0 0 min(88%, 640px);
  scroll-snap-align: start;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.banner-slide img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.banner-caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2rem 1rem 0.875rem;
  background: linear-gradient(transparent, rgba(15, 23, 42, 0.75));
  font-weight: 600;
}

.hero {
  max-width: 960px;
  margin: 0 auto 2rem;
  padding: 0 1.5rem;
}

.hero-inner {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 600;
}

.hero-text h1 {
  margin: 0 0 0.375rem;
  font-size: 1.75rem;
}

.tags {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
}

.bio {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
}

.section {
  max-width: 960px;
  margin: 0 auto 2rem;
  padding: 0 1.5rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border);
}

.section-head h2 {
  margin: 0;
  font-size: 1.125rem;
}

.count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.grid {
  display: grid;
  gap: 1rem;
}

.item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
}

.thumb.wide {
  width: 96px;
  height: 72px;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.act-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-weight: 600;
}

.status.ongoing {
  background: #dcfce7;
  color: #166534;
}

.status.upcoming {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.ended {
  background: #f1f5f9;
  color: #64748b;
}

.time {
  margin: 0.25rem 0 0.375rem;
  font-size: 0.8125rem;
}

.gallery-tabs {
  display: flex;
  gap: 0.375rem;
}

.gallery-tab {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.gallery-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.gallery-tab .count {
  font-size: 0.6875rem;
  opacity: 0.85;
}

.empty-gallery {
  text-align: center;
  padding: 2rem 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.gallery-grid figure {
  margin: 0;
}

.img-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
  border-radius: 10px;
  overflow: hidden;
}

.gallery-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.gallery-grid figcaption {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.375rem;
  text-align: center;
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 23, 42, 0.85);
  display: grid;
  place-items: center;
  padding: 1.5rem;
  cursor: zoom-out;
}

.lightbox img {
  max-width: min(100%, 960px);
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>
