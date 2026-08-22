<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import MusicBubbleCloud from '@/components/MusicBubbleCloud.vue'
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
const playError = ref('')

async function startPlayback(index: number) {
  const song = props.songs[index]
  if (!song?.audioUrl?.trim()) {
    playError.value = '演示曲目暂无音频，后台恢复数据后可播放'
    hasStarted.value = false
    isPlaying.value = false
    currentIndex.value = index
    return
  }
  playError.value = ''
  currentIndex.value = index
  hasStarted.value = true
  await nextTick()
  try {
    await audioRef.value?.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
    playError.value = '无法播放音频，请稍后重试'
  }
}

function togglePlayback() {
  if (!currentSong.value) {
    if (props.songs.length) startPlayback(0)
    return
  }
  if (!hasStarted.value) {
    startPlayback(currentIndex.value)
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

const vinylActive = computed(() => isPlaying.value && hasStarted.value)

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

    <MusicBubbleCloud
      :songs="songs"
      :active-index="currentIndex"
      :playing="isPlaying && hasStarted"
      :focus-active="hasStarted"
      @select="startPlayback"
    />

    <div class="vinyl-area" @click="togglePlayback">
      <div class="vinyl-tonearm" :class="{ playing: vinylActive }">
        <div class="vinyl-tonearm-arm">
          <div class="vinyl-tonearm-pivot" />
          <div class="vinyl-tonearm-head">
            <div class="vinyl-tonearm-stylus" />
          </div>
        </div>
      </div>
      <button
        type="button"
        class="vinyl-record-btn"
        :class="{ spinning: vinylActive, paused: hasStarted && !isPlaying }"
        :aria-label="vinylActive ? '暂停播放' : '播放音乐'"
        @click.stop="togglePlayback"
      >
        <div class="vinyl-record">
          <div class="vinyl-label">
            <span class="vinyl-label-text">{{ labelName }}</span>
            <span class="vinyl-label-song">{{ currentSong?.title || '—' }}</span>
          </div>
        </div>
        <span v-if="hasStarted && !isPlaying" class="vinyl-play-badge" aria-hidden="true">▶</span>
      </button>
      <div class="vinyl-song-name">{{ currentSong?.title || '选择一首歌曲' }}</div>
      <div class="vinyl-song-artist">
        {{ currentSong ? (currentSong.artist || labelName) : '点击左侧方块或唱片播放' }}
      </div>
      <p v-if="playError" class="vinyl-error">{{ playError }}</p>
      <p class="vinyl-hint muted">{{ vinylActive ? '点击唱片暂停' : hasStarted ? '点击唱片继续播放' : '点击左侧方块或唱片播放' }}</p>
    </div>
  </div>
</template>

<style scoped>
.vinyl-record-btn {
  position: relative;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
}

.vinyl-record-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 6px;
}

.vinyl-play-badge {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(20, 20, 20, 0.28);
  border-radius: 50%;
  pointer-events: none;
}

.vinyl-hint {
  margin: 0.5rem 0 0;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.vinyl-error {
  margin: 0.35rem 0 0;
  font-size: 12px;
  color: var(--accent-warm, #c4a35a);
  text-align: center;
}
</style>
