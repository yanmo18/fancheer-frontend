<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { SongItem } from '@/types/api'

const props = defineProps<{
  songs: SongItem[]
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const currentIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const hasStarted = ref(false)

const currentSong = computed(() => props.songs[currentIndex.value] ?? null)

const progressPercent = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0,
)

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function startPlayback(index: number) {
  currentIndex.value = index
  hasStarted.value = true
  document.body.classList.add('music-player-active')
  await nextTick()
  try {
    await audioRef.value?.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
}

function togglePlay() {
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

function playPrev() {
  if (!props.songs.length) return
  const next = currentIndex.value > 0 ? currentIndex.value - 1 : props.songs.length - 1
  startPlayback(next)
}

function playNext() {
  if (!props.songs.length) return
  const next = currentIndex.value < props.songs.length - 1 ? currentIndex.value + 1 : 0
  startPlayback(next)
}

function onTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime ?? 0
}

function onLoadedMetadata() {
  duration.value = audioRef.value?.duration ?? 0
}

function onEnded() {
  playNext()
}

function seek(e: Event) {
  const value = Number((e.target as HTMLInputElement).value)
  if (audioRef.value && Number.isFinite(value)) {
    audioRef.value.currentTime = value
    currentTime.value = value
  }
}

watch(currentIndex, async () => {
  currentTime.value = 0
  duration.value = 0
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
    if (currentIndex.value >= list.length) {
      currentIndex.value = 0
    }
    if (!list.length) {
      hasStarted.value = false
      isPlaying.value = false
      document.body.classList.remove('music-player-active')
    }
  },
)

onBeforeUnmount(() => {
  audioRef.value?.pause()
  document.body.classList.remove('music-player-active')
})
</script>

<template>
  <div class="music-player">
    <audio
      ref="audioRef"
      :src="currentSong?.audioUrl"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @pause="isPlaying = false"
      @play="isPlaying = true"
    />

    <ul class="playlist card">
      <li
        v-for="(song, index) in songs"
        :key="song.id"
        class="track"
        :class="{ active: index === currentIndex && hasStarted }"
      >
        <button type="button" class="track-btn" @click="startPlayback(index)">
          <div class="track-cover">
            <img v-if="song.coverUrl" :src="song.coverUrl" :alt="song.title" />
            <span v-else class="cover-fallback">♪</span>
            <span v-if="index === currentIndex && isPlaying" class="playing-badge">播放中</span>
          </div>
          <div class="track-meta">
            <strong>{{ song.title }}</strong>
            <span class="muted">{{ song.artist || '未知艺术家' }}</span>
          </div>
          <span class="play-icon" aria-hidden="true">
            {{ index === currentIndex && isPlaying ? '❚❚' : '▶' }}
          </span>
        </button>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="hasStarted && currentSong" class="player-bar">
        <div class="bar-inner">
          <div class="now-playing">
            <div class="bar-cover">
              <img v-if="currentSong.coverUrl" :src="currentSong.coverUrl" :alt="currentSong.title" />
              <span v-else class="cover-fallback">♪</span>
            </div>
            <div class="bar-meta">
              <strong>{{ currentSong.title }}</strong>
              <span class="muted">{{ currentSong.artist || '未知艺术家' }}</span>
            </div>
          </div>

          <div class="controls">
            <div class="control-buttons">
              <button type="button" class="icon-btn" aria-label="上一首" @click="playPrev">⏮</button>
              <button type="button" class="icon-btn primary" aria-label="播放或暂停" @click="togglePlay">
                {{ isPlaying ? '❚❚' : '▶' }}
              </button>
              <button type="button" class="icon-btn" aria-label="下一首" @click="playNext">⏭</button>
            </div>
            <div class="progress-row">
              <span class="time">{{ formatTime(currentTime) }}</span>
              <input
                class="progress"
                type="range"
                min="0"
                :max="duration || 0"
                step="0.1"
                :value="currentTime"
                :style="{ '--progress': `${progressPercent}%` }"
                @input="seek"
              />
              <span class="time">{{ formatTime(duration) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.music-player {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.playlist {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.track {
  border-bottom: 1px solid var(--border);
}

.track:last-child {
  border-bottom: none;
}

.track.active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08), transparent);
}

.track-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: background 0.15s;
}

.track-btn:hover {
  background: rgba(99, 102, 241, 0.05);
}

.track-cover,
.bar-cover {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #c7d2fe, #e0e7ff);
  display: grid;
  place-items: center;
}

.track-cover img,
.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  font-size: 1.25rem;
  color: var(--primary);
}

.playing-badge {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.125rem;
  font-size: 0.625rem;
  text-align: center;
  color: #fff;
  background: rgba(99, 102, 241, 0.85);
}

.track-meta,
.bar-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.track-meta strong,
.bar-meta strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-icon {
  width: 2rem;
  text-align: center;
  color: var(--primary);
  font-size: 0.875rem;
}

.player-bar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
}

.bar-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 220px) 1fr;
  gap: 1rem;
  align-items: center;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.bar-cover {
  width: 48px;
  height: 48px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font-size: 0.9375rem;
  color: var(--text);
}

.icon-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.icon-btn.primary {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--primary);
  color: #fff;
  font-size: 1rem;
}

.icon-btn.primary:hover {
  background: var(--primary-hover);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time {
  font-size: 0.75rem;
  color: var(--text-muted);
  width: 2.5rem;
  flex-shrink: 0;
}

.time:last-child {
  text-align: right;
}

.progress {
  flex: 1;
  height: 4px;
  appearance: none;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--primary) 0%,
    var(--primary) var(--progress),
    #e2e8f0 var(--progress),
    #e2e8f0 100%
  );
  cursor: pointer;
}

.progress::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2);
}

.progress::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
}

@media (max-width: 640px) {
  .bar-inner {
    grid-template-columns: 1fr;
    gap: 0.625rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }

  .now-playing {
    justify-content: center;
  }
}
</style>
