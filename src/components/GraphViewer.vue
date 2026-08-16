<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GraphData, GraphCharacter } from '@/types/api'

const props = defineProps<{
  data: GraphData
}>()

const selectedId = ref<string | null>(null)

const center = computed(() =>
  props.data.characters.find((c) => c.isCenter) ?? props.data.characters[0] ?? null,
)

const others = computed(() =>
  props.data.characters.filter((c) => c.id !== center.value?.id),
)

const selected = computed(() =>
  props.data.characters.find((c) => c.id === selectedId.value) ?? null,
)

const positions = computed(() => {
  const map = new Map<string, { x: number; y: number }>()
  const cx = 400
  const cy = 260
  const rx = 200
  const ry = 150

  if (center.value) {
    map.set(center.value.id, { x: cx, y: cy })
  }

  others.value.forEach((char, index) => {
    const angle = (2 * Math.PI * index) / Math.max(others.value.length, 1) - Math.PI / 2
    map.set(char.id, {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    })
  })

  return map
})

const edges = computed(() =>
  props.data.relations
    .map((rel) => {
      const from = positions.value.get(rel.fromCharacterId)
      const to = positions.value.get(rel.toCharacterId)
      if (!from || !to) return null
      return {
        id: rel.id,
        from,
        to,
        label: rel.relationLabel,
        mid: {
          x: (from.x + to.x) / 2,
          y: (from.y + to.y) / 2,
        },
      }
    })
    .filter(Boolean) as Array<{
    id: string
    from: { x: number; y: number }
    to: { x: number; y: number }
    label: string
    mid: { x: number; y: number }
  }>,
)

function selectCharacter(char: GraphCharacter) {
  selectedId.value = selectedId.value === char.id ? null : char.id
}

function nodeRadius(char: GraphCharacter) {
  return char.isCenter ? 52 : 42
}

const selectedRelations = computed(() => {
  if (!selectedId.value) return []
  return props.data.relations.filter(
    (r) => r.fromCharacterId === selectedId.value || r.toCharacterId === selectedId.value,
  )
})
</script>

<template>
  <div v-if="data.characters.length" class="graph-wrapper graph-viewer">
    <div class="graph-canvas">
      <svg viewBox="0 0 800 520" class="graph-svg" aria-hidden="true">
        <defs>
          <marker
            id="graph-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
          </marker>
        </defs>

        <g class="graph-edges">
          <g v-for="edge in edges" :key="edge.id">
            <line
              :x1="edge.from.x"
              :y1="edge.from.y"
              :x2="edge.to.x"
              :y2="edge.to.y"
              class="edge-line"
              marker-end="url(#graph-arrow)"
            />
            <rect
              :x="edge.mid.x - 36"
              :y="edge.mid.y - 12"
              width="72"
              height="24"
              rx="12"
              class="edge-label-bg"
            />
            <text
              :x="edge.mid.x"
              :y="edge.mid.y + 4"
              text-anchor="middle"
              class="edge-label"
            >
              {{ edge.label }}
            </text>
          </g>
        </g>

        <g
          v-for="char in data.characters"
          :key="char.id"
          class="graph-node"
          :class="{
            'graph-node--center': char.isCenter,
            'graph-node--selected': selectedId === char.id,
          }"
          :transform="`translate(${positions.get(char.id)?.x ?? 0}, ${positions.get(char.id)?.y ?? 0})`"
          @click="selectCharacter(char)"
        >
          <circle
            :r="nodeRadius(char) + 6"
            class="node-ring"
          />
          <clipPath :id="`clip-${char.id}`">
            <circle :r="nodeRadius(char)" />
          </clipPath>
          <image
            v-if="char.avatarUrl"
            :href="char.avatarUrl"
            :x="-nodeRadius(char)"
            :y="-nodeRadius(char)"
            :width="nodeRadius(char) * 2"
            :height="nodeRadius(char) * 2"
            :clip-path="`url(#clip-${char.id})`"
            preserveAspectRatio="xMidYMid slice"
          />
          <circle
            v-else
            :r="nodeRadius(char)"
            class="node-placeholder"
          />
          <text :y="nodeRadius(char) + 22" text-anchor="middle" class="node-name">
            {{ char.name }}
          </text>
        </g>
      </svg>
    </div>

    <aside v-if="selected" class="graph-detail">
      <img
        v-if="selected.avatarUrl"
        :src="selected.avatarUrl"
        :alt="selected.name"
        class="detail-avatar"
      />
      <div v-else class="detail-avatar detail-avatar--placeholder">
        {{ selected.name.charAt(0) }}
      </div>
      <h3>{{ selected.name }}</h3>
      <p v-if="selected.bio" class="detail-bio">{{ selected.bio }}</p>
      <ul class="detail-relations">
        <li v-for="rel in selectedRelations" :key="rel.id">
          <template v-if="selected && rel.fromCharacterId === selected.id">
            → {{ data.characters.find(c => c.id === rel.toCharacterId)?.name }}：{{ rel.relationLabel }}
          </template>
          <template v-else>
            ← {{ data.characters.find(c => c.id === rel.fromCharacterId)?.name }}：{{ rel.relationLabel }}
          </template>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.graph-viewer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 1.5rem;
  align-items: stretch;
  height: auto;
  min-height: 480px;
  padding: 1rem;
}

.graph-canvas {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
}

.graph-svg {
  display: block;
  width: 100%;
  height: auto;
}

.edge-line {
  stroke: var(--border-medium);
  stroke-width: 2;
}

.edge-label-bg {
  fill: var(--bg-card);
  stroke: var(--border-subtle);
}

.edge-label {
  fill: var(--text-muted);
  font-size: 12px;
}

.graph-node {
  cursor: pointer;
}

.node-ring {
  fill: var(--bg-card);
  stroke: var(--border-medium);
  stroke-width: 3;
}

.graph-node--center .node-ring {
  stroke: var(--accent-primary);
  stroke-width: 4;
}

.graph-node--selected .node-ring {
  stroke: var(--gold);
}

.node-placeholder {
  fill: var(--bg-elevated);
}

.node-name {
  fill: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}

.graph-detail {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 1rem;
}

.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
}

.detail-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #475569;
  font-size: 1.5rem;
  font-weight: 700;
}

.graph-detail h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.detail-bio {
  margin: 0 0 0.75rem;
  color: #64748b;
  line-height: 1.5;
  font-size: 0.9rem;
}

.detail-relations {
  margin: 0;
  padding-left: 1.1rem;
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .graph-viewer {
    grid-template-columns: 1fr;
  }
}
</style>
