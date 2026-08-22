<script setup lang="ts">
import * as d3 from 'd3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SongItem } from '@/types/api'

const props = defineProps<{
  songs: SongItem[]
  activeIndex: number
  playing?: boolean
  focusActive?: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

type BubbleNode = d3.SimulationNodeDatum & {
  id: string
  index: number
  title: string
  coverUrl?: string
  coverSize: number
  width: number
  height: number
  collideRadius: number
}

const containerRef = ref<HTMLElement | null>(null)
const nodes = ref<BubbleNode[]>([])
const frame = ref(0)

let simulation: d3.Simulation<BubbleNode, undefined> | null = null
let resizeObserver: ResizeObserver | null = null
let draggingNode: BubbleNode | null = null
let dragMoved = false
let dragStartX = 0
let dragStartY = 0
let centerX = 0
let centerY = 0

const layoutFrame = computed(() => frame.value)

function bubbleLayout(index: number) {
  const coverSize = 56 + (index % 4) * 10
  const paddingX = 8
  const paddingY = 6
  const titleHeight = 32
  const width = coverSize + paddingX * 2
  const height = coverSize + titleHeight + paddingY * 2
  return {
    coverSize,
    width,
    height,
    collideRadius: Math.hypot(width, height) / 2 + 6,
  }
}

function bubbleStyle(node: BubbleNode) {
  layoutFrame.value
  const x = node.x ?? centerX
  const y = node.y ?? centerY
  return {
    width: `${node.width}px`,
    height: `${node.height}px`,
    transform: `translate3d(${x - node.width / 2}px, ${y - node.height / 2}px, 0)`,
    zIndex: node.index === props.activeIndex ? 4 : 1,
  }
}

function coverStyle(node: BubbleNode) {
  return {
    width: `${node.coverSize}px`,
    height: `${node.coverSize}px`,
  }
}

function stopSimulation() {
  simulation?.stop()
  simulation = null
}

function focusActiveToCenter() {
  if (!props.focusActive || !simulation) return

  const activeNode = nodes.value.find((node) => node.index === props.activeIndex)
  if (!activeNode) return

  nodes.value.forEach((node) => {
    if (node !== activeNode) {
      node.fx = null
      node.fy = null
    }
  })

  activeNode.fx = centerX
  activeNode.fy = centerY
  simulation.alpha(0.72).restart()
}

function buildSimulation() {
  const el = containerRef.value
  if (!el || !props.songs.length) {
    nodes.value = []
    stopSimulation()
    return
  }

  const width = el.clientWidth
  const height = el.clientHeight
  if (width < 40 || height < 40) return

  centerX = width / 2
  centerY = height / 2

  stopSimulation()

  const data: BubbleNode[] = props.songs.map((song, index) => {
    const layout = bubbleLayout(index)
    return {
      id: song.id,
      index,
      title: song.title,
      coverUrl: song.coverUrl,
      coverSize: layout.coverSize,
      width: layout.width,
      height: layout.height,
      collideRadius: layout.collideRadius,
      x: centerX + (Math.random() - 0.5) * width * 0.38,
      y: centerY + (Math.random() - 0.5) * height * 0.38,
    }
  })

  nodes.value = data

  simulation = d3
    .forceSimulation(data)
    .force('charge', d3.forceManyBody<BubbleNode>().strength(-240))
    .force('center', d3.forceCenter(centerX, centerY).strength(0.05))
    .force(
      'collide',
      d3.forceCollide<BubbleNode>()
        .radius((d) => d.collideRadius)
        .iterations(3),
    )
    .force('x', d3.forceX(centerX).strength(0.03))
    .force('y', d3.forceY(centerY).strength(0.03))
    .velocityDecay(0.34)
    .alpha(0.95)
    .alphaDecay(0.02)
    .on('tick', () => {
      frame.value++
    })

  focusActiveToCenter()
}

function coverFallback(title: string) {
  return title.slice(0, 1).toUpperCase() || '♪'
}

function onCoverError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  img.nextElementSibling?.classList.add('visible')
}

function onPointerDown(event: PointerEvent, node: BubbleNode) {
  event.preventDefault()
  draggingNode = node
  dragMoved = false
  dragStartX = event.clientX
  dragStartY = event.clientY
  node.fx = node.x
  node.fy = node.y
  simulation?.alphaTarget(0.35).restart()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!draggingNode || !containerRef.value) return

  if (Math.abs(event.clientX - dragStartX) > 4 || Math.abs(event.clientY - dragStartY) > 4) {
    dragMoved = true
  }

  const rect = containerRef.value.getBoundingClientRect()
  draggingNode.fx = event.clientX - rect.left
  draggingNode.fy = event.clientY - rect.top
}

function onPointerUp() {
  if (draggingNode && !dragMoved) {
    emit('select', draggingNode.index)
  } else if (draggingNode) {
    draggingNode.fx = null
    draggingNode.fy = null
  }

  draggingNode = null
  simulation?.alphaTarget(0)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function onBubbleKeydown(event: KeyboardEvent, node: BubbleNode) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', node.index)
  }
}

onMounted(async () => {
  await nextTick()
  buildSimulation()

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      buildSimulation()
    })
    resizeObserver.observe(containerRef.value)
  }
})

watch(
  () => props.songs,
  () => buildSimulation(),
  { deep: true },
)

watch(
  () => [props.activeIndex, props.focusActive] as const,
  () => focusActiveToCenter(),
)

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  resizeObserver?.disconnect()
  stopSimulation()
})
</script>

<template>
  <div ref="containerRef" class="music-bubble-cloud" aria-label="音乐作品词云">
    <div class="music-bubble-cloud-bg" aria-hidden="true" />
    <div class="music-bubble-center-ring" aria-hidden="true" />
    <p class="music-bubble-hint muted">拖动方块探索 · 点击播放并居中</p>

    <button
      v-for="node in nodes"
      :key="node.id"
      type="button"
      class="music-bubble"
      :class="{
        active: node.index === activeIndex,
        playing: node.index === activeIndex && playing,
        centered: node.index === activeIndex && focusActive,
      }"
      :style="bubbleStyle(node)"
      :title="node.title"
      @pointerdown="onPointerDown($event, node)"
      @keydown="onBubbleKeydown($event, node)"
    >
      <div class="music-bubble-cover" :style="coverStyle(node)">
        <img
          v-if="node.coverUrl"
          :src="node.coverUrl"
          :alt="node.title"
          loading="lazy"
          draggable="false"
          @error="onCoverError"
        />
        <span class="music-bubble-fallback" :class="{ visible: !node.coverUrl }">
          {{ coverFallback(node.title) }}
        </span>
        <span v-if="node.index === activeIndex && playing" class="music-bubble-playing" aria-hidden="true">▶</span>
      </div>
      <span class="music-bubble-title">{{ node.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.music-bubble-cloud {
  position: relative;
  min-height: 360px;
  height: 100%;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
  background:
    radial-gradient(circle at 30% 35%, rgba(201, 169, 98, 0.08), transparent 45%),
    radial-gradient(circle at 70% 65%, rgba(184, 149, 106, 0.06), transparent 40%),
    var(--bg-card);
  overflow: hidden;
  touch-action: none;
}

.music-bubble-cloud-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 0, transparent 55%);
  pointer-events: none;
}

.music-bubble-center-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(201, 169, 98, 0.22);
  pointer-events: none;
}

.music-bubble-hint {
  position: absolute;
  left: 16px;
  bottom: 14px;
  z-index: 2;
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.04em;
  pointer-events: none;
}

.music-bubble {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 6px 8px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(248, 242, 232, 0.9));
  box-shadow: 0 8px 24px rgba(62, 48, 35, 0.08);
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  text-align: center;
  color: var(--text-primary);
  overflow: visible;
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
  will-change: transform;
  user-select: none;
}

.music-bubble:active {
  cursor: grabbing;
}

.music-bubble:hover {
  border-color: var(--border-accent);
  box-shadow: 0 12px 28px rgba(62, 48, 35, 0.12);
}

.music-bubble.active {
  border-color: var(--accent-primary);
  background: var(--accent-gradient-subtle);
  box-shadow: 0 0 0 3px var(--accent-glow), 0 14px 30px rgba(62, 48, 35, 0.14);
}

.music-bubble.centered {
  scale: 1.04;
}

.music-bubble.playing {
  animation: bubblePulse 1.6s ease-in-out infinite;
}

.music-bubble-cover {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(62, 48, 35, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  background: var(--accent-gradient-subtle);
}

.music-bubble-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.music-bubble-fallback {
  position: absolute;
  inset: 0;
  display: none;
  place-items: center;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--accent-primary);
  background: var(--accent-gradient-subtle);
}

.music-bubble-fallback.visible {
  display: grid;
}

.music-bubble-playing {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: #fff;
  background: rgba(62, 48, 35, 0.38);
  border-radius: inherit;
}

.music-bubble.active .music-bubble-cover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.music-bubble-title {
  width: 100%;
  min-height: 28px;
  font-size: 11px;
  line-height: 1.3;
  padding: 0 2px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--text-secondary);
  word-break: break-all;
}

.music-bubble.active .music-bubble-title {
  color: var(--accent-primary);
  font-weight: 600;
}

@keyframes bubblePulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--accent-glow), 0 14px 30px rgba(62, 48, 35, 0.14);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(201, 169, 98, 0.22), 0 16px 34px rgba(62, 48, 35, 0.16);
  }
}

@media (max-width: 768px) {
  .music-bubble-cloud {
    min-height: 300px;
  }
}
</style>
