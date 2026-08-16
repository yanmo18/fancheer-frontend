<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { SongItem } from '@/types/api'

const props = defineProps<{
  songs: SongItem[]
  streamerName?: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const currentIndex = ref(0)
const isPlaying = ref(false)
const hasStarted = ref(false)

const currentSong = computed(() => props.songs[currentIndex.value] ?? null)
const labelName = computed(() => props.streamerName || 'Fancheer')

async function startPlayback(index: number) {
  currentIndex.value = index
  hasStarted.value = true
  await nextTick()
  try {
    await audioRef.value?.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
}

function togglePlay(index?: number) {
  if (typeof index === 'number') {
    startPlayback(index)
    return
  }
  if (!currentSong.value) return
  if (!hasStarted.value) {
    startPlayback(0)
    return
  }
  if (isPlaying.value) {
    audioRef.value?.pause()
    isPlaying.value = false
  } else {
    audioRef.value?.play().then(() => {
      isPlaying.value = true
    }).catch(() => {
      isPlaying.value = false
    })
  }
}

function onEnded() {
  if (!props.songs.length) return
  const next = currentIndex.value < props.songs.length - 1 ? currentIndex.value + 1 : 0
  startPlayback(next)
}

watch(currentIndex, async () => {
  if (!hasStarted.value) return
  await nextTick()
  try {
    await audioRef.value?.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
})

watch(
  () => props.songs,
  (list) => {
    if (currentIndex.value >= list.length) currentIndex.value = 0
    if (!list.length) {
      hasStarted.value = false
      isPlaying.value = false
    }
  },
)

onBeforeUnmount(() => {
  audioRef.value?.pause()
})
</script>

<template>
  <div class="music-layout">
    <audio
      ref="audioRef"
      :src="currentSong?.audioUrl"
      preload="metadata"
      @ended="onEnded"
      @pause="isPlaying = false"
      @play="isPlaying = true"
    />

    <div class="music-playlist">
      <div
        v-for="(song, index) in songs"
        :key="song.id"
        class="music-playlist-item"
        :class="{ active: index === currentIndex && hasStarted }"
        @click="startPlayback(index)"
      >
        <div class="music-playlist-cover">
          <img v-if="song.coverUrl" :src="song.coverUrl" :alt="song.title" class="cover-img" />
          <span v-else>🎵</span>
        </div>
        <div class="music-playlist-info">
          <div class="music-playlist-title">{{ song.title }}</div>
          <div class="music-playlist-artist">{{ song.artist || labelName }}</div>
        </div>
        <button type="button" class="music-playlist-btn" @click.stop="togglePlay(index)">▶</button>
      </div>
    </div>

    <div class="vinyl-area">
      <div class="vinyl-tonearm" :class="{ playing: isPlaying }">
        <div class="vinyl-tonearm-arm">
          <div class="vinyl-tonearm-pivot" />
          <div class="vinyl-tonearm-head">
            <div class="vinyl-tonearm-stylus" />
          </div>
        </div>
      </div>
      <div class="vinyl-record" :class="{ spinning: isPlaying }">
        <div class="vinyl-label">
          <span class="vinyl-label-text">{{ labelName }}</span>
          <span class="vinyl-label-song">{{ currentSong?.title || '—' }}</span>
        </div>
      </div>
      <div class="vinyl-song-name">{{ currentSong?.title || '选择一首歌曲' }}</div>
      <div class="vinyl-song-artist">
        {{ currentSong ? (currentSong.artist || labelName) : '点击左侧列表播放' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
</style>
