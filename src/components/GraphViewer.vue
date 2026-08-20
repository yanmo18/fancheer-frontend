<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ECharts } from 'echarts'
import type { GraphData } from '@/types/api'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  data: GraphData
}>()

const { theme } = useTheme()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null
let echartsModule: typeof import('echarts') | null = null
let resizeObserver: ResizeObserver | null = null
let hasOption = false
let renderToken = 0

const circularAvatarCache = new Map<string, string>()

const NODE_COLORS = [
  '#7B3FA0',
  '#C4956A',
  '#A0522D',
  '#9B6B8E',
  '#6B8E6B',
  '#C4A35A',
  '#B85C5C',
  '#5A8FA0',
]

const LINK_COLORS = [
  '#8B3352',
  '#7B3FA0',
  '#C4956A',
  '#A0522D',
  '#9B6B8E',
  '#6B8E6B',
  '#C4A35A',
  '#B85C5C',
  '#5A8FA0',
  '#6B2D5B',
]

function cssVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nodeTooltipHtml(name: string, bio: string, relations: string[]) {
  const lines = [`<b>${escapeHtml(name)}</b>`]
  if (bio.trim()) {
    bio.split(/\n+/).forEach((line) => {
      if (line.trim()) lines.push(escapeHtml(line.trim()))
    })
  }
  if (relations.length) {
    lines.push('')
    relations.slice(0, 4).forEach((rel) => lines.push(escapeHtml(rel)))
    if (relations.length > 4) lines.push('…')
  }
  return lines.join('<br/>')
}

function nodeId(value: string | number | undefined | null) {
  return value == null ? '' : String(value)
}

function resolveImageUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `${window.location.protocol}${url}`
  if (url.startsWith('/')) return `${window.location.origin}${url}`
  return url
}

function isUsableAvatarUrl(url?: string | null) {
  return Boolean(url?.trim())
}

function nodeLabelInside(name: string, isCenter: boolean) {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  if (isCenter) return trimmed.length <= 3 ? trimmed : trimmed.slice(0, 2)
  return trimmed.length <= 2 ? trimmed : trimmed.slice(0, 1)
}

function getSymbolSize(isCenter: boolean, relationCount: number) {
  return isCenter ? 64 : Math.max(28, 44 - Math.min(14, relationCount * 2))
}

function createCircularAvatarDataUrl(
  src: string,
  size: number,
  options: { borderColor: string; borderWidth: number; shadowBlur?: number },
) {
  const cacheKey = `${src}@${size}@${options.borderColor}@${options.borderWidth}@${options.shadowBlur ?? 0}`
  const cached = circularAvatarCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvasSize = Math.round(size * dpr)

  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvasSize
      canvas.height = canvasSize
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas unavailable'))
        return
      }

      const center = canvasSize / 2
      const outerRadius = canvasSize / 2 - dpr
      const border = options.borderWidth * dpr
      const imageRadius = Math.max(outerRadius - border, canvasSize * 0.2)

      if (options.shadowBlur) {
        ctx.save()
        ctx.shadowBlur = options.shadowBlur * dpr
        ctx.shadowColor = 'rgba(0,0,0,0.18)'
        ctx.beginPath()
        ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
        ctx.fillStyle = options.borderColor
        ctx.fill()
        ctx.restore()
      }

      ctx.beginPath()
      ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
      ctx.fillStyle = options.borderColor
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, imageRadius, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      const diameter = imageRadius * 2
      const scale = Math.max(diameter / img.width, diameter / img.height)
      const width = img.width * scale
      const height = img.height * scale
      ctx.drawImage(img, center - width / 2, center - height / 2, width, height)
      ctx.restore()

      const dataUrl = canvas.toDataURL('image/png')
      circularAvatarCache.set(cacheKey, dataUrl)
      resolve(dataUrl)
    }
    img.onerror = () => reject(new Error(`failed to load avatar: ${src}`))
    img.src = src
  })
}

async function prepareCircularAvatars(
  relationLinesByChar: Map<string, string[]>,
  isDark: boolean,
) {
  const avatarMap = new Map<string, string>()

  await Promise.all(
    props.data.characters.map(async (char) => {
      if (!isUsableAvatarUrl(char.avatarUrl)) return

      const charId = nodeId(char.id)
      const relationCount = relationLinesByChar.get(charId)?.length ?? 0
      const symbolSize = getSymbolSize(char.isCenter, relationCount)
      const borderColor = isDark ? 'rgba(255,255,255,0.9)' : '#ffffff'

      try {
        const dataUrl = await createCircularAvatarDataUrl(resolveImageUrl(char.avatarUrl!), symbolSize, {
          borderColor,
          borderWidth: char.isCenter ? 3 : 2.5,
          shadowBlur: char.isCenter ? 8 : 4,
        })
        avatarMap.set(charId, dataUrl)
      } catch {
        /* fallback to colored circle + name */
      }
    }),
  )

  return avatarMap
}

function buildRelationLinesByChar() {
  const nameById = new Map(props.data.characters.map((c) => [nodeId(c.id), c.name]))
  const relationLinesByChar = new Map<string, string[]>()

  for (const char of props.data.characters) {
    relationLinesByChar.set(nodeId(char.id), [])
  }

  for (const rel of props.data.relations) {
    const fromId = nodeId(rel.fromCharacterId)
    const toId = nodeId(rel.toCharacterId)
    const fromName = nameById.get(fromId) ?? '?'
    const toName = nameById.get(toId) ?? '?'
    relationLinesByChar.get(fromId)?.push(`→ ${toName}：${rel.relationLabel}`)
    relationLinesByChar.get(toId)?.push(`← ${fromName}：${rel.relationLabel}`)
  }

  return relationLinesByChar
}

function buildOption(avatarMap: Map<string, string>) {
  const isDark = theme.value === 'dark'
  const textColor = isDark ? '#a89e96' : '#5A6068'
  const accentPrimary = cssVar('--accent-primary', '#8B3352')
  const accentSecondary = cssVar('--accent-secondary', '#6B2D5B')

  const nameById = new Map(props.data.characters.map((c) => [nodeId(c.id), c.name]))
  const centerChar = props.data.characters.find((c) => c.isCenter)
  const centerId = centerChar ? nodeId(centerChar.id) : ''
  const nodeCount = props.data.characters.length
  const centerNeighbors = new Set<string>()
  if (centerId) {
    for (const rel of props.data.relations) {
      const fromId = nodeId(rel.fromCharacterId)
      const toId = nodeId(rel.toCharacterId)
      if (fromId === centerId) centerNeighbors.add(toId)
      if (toId === centerId) centerNeighbors.add(fromId)
    }
  }

  const relationLinesByChar = buildRelationLinesByChar()

  let colorIndex = 0
  const nodes = props.data.characters.map((char) => {
    const charId = nodeId(char.id)
    const relationHint = relationLinesByChar.get(charId) ?? []
    const symbolSize = getSymbolSize(char.isCenter, relationHint.length)
    const nodeColor = char.isCenter
      ? accentPrimary
      : NODE_COLORS[colorIndex++ % NODE_COLORS.length]
    const circularAvatar = avatarMap.get(charId)
    const hasAvatar = Boolean(circularAvatar)

    return {
      id: charId,
      name: char.name,
      value: char.isCenter ? 20 : 10,
      symbol: hasAvatar ? `image://${circularAvatar}` : 'circle',
      symbolSize,
      symbolKeepAspect: hasAvatar,
      category: char.isCenter ? 0 : centerNeighbors.has(charId) ? 1 : 2,
      itemStyle: {
        color: nodeColor,
        borderColor: 'transparent',
        borderWidth: 0,
        shadowBlur: hasAvatar ? 0 : char.isCenter ? 12 : 0,
        shadowColor: char.isCenter ? `${accentPrimary}55` : 'transparent',
      },
      label: {
        show: true,
        position: hasAvatar ? 'bottom' : 'inside',
        formatter: hasAvatar ? char.name : nodeLabelInside(char.name, char.isCenter),
        color: hasAvatar ? textColor : '#ffffff',
        fontSize: hasAvatar ? (char.isCenter ? 13 : 11) : char.isCenter ? 13 : 12,
        fontWeight: char.isCenter ? 'bold' : 600,
        textBorderColor: hasAvatar ? 'transparent' : 'rgba(0,0,0,0.18)',
        textBorderWidth: hasAvatar ? 0 : 1,
      },
      tooltip: {
        formatter: nodeTooltipHtml(char.name, char.bio ?? '', relationHint),
      },
    }
  })

  const links = props.data.relations
    .map((rel, index) => {
      const source = nodeId(rel.fromCharacterId)
      const target = nodeId(rel.toCharacterId)
      if (!source || !target || !nameById.has(source) || !nameById.has(target)) return null

      const touchesCenter = source === centerId || target === centerId

      return {
        source,
        target,
        value: touchesCenter ? 8 : 4,
        lineStyle: {
          color: LINK_COLORS[index % LINK_COLORS.length],
          width: touchesCenter ? 2.5 : 1.5,
          curveness: 0.12,
          opacity: 0.85,
        },
        emphasis: {
          lineStyle: {
            width: 4,
            opacity: 1,
          },
        },
        tooltip: {
          formatter: escapeHtml(rel.relationLabel || '关联'),
        },
      }
    })
    .filter((link): link is NonNullable<typeof link> => link != null)

  return {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'item',
      enterable: true,
      confine: true,
      backgroundColor: isDark ? 'rgba(40,40,50,0.95)' : 'rgba(255,255,255,0.95)',
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(180,140,100,0.12)',
      borderWidth: 1,
      textStyle: { color: isDark ? '#ece8e4' : '#3D3028', fontSize: 12, lineHeight: 18 },
      padding: [10, 14],
      extraCssText: isDark
        ? 'box-shadow: 0 8px 24px rgba(0,0,0,0.35); border-radius: 8px;'
        : 'box-shadow: 0 8px 24px rgba(61,48,40,0.12); border-radius: 8px;',
    },
    legend: { show: false },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links,
        categories: [
          { name: '中心', itemStyle: { color: accentPrimary } },
          { name: '核心', itemStyle: { color: accentSecondary } },
          { name: '关联', itemStyle: { color: '#9B6B8E' } },
        ],
        roam: true,
        draggable: true,
        scaleLimit: { min: 0.4, max: 3 },
        force: {
          repulsion: Math.max(320, nodeCount * 28),
          gravity: centerId ? 0.12 : 0.08,
          edgeLength: nodeCount > 8 ? [90, 160] : [120, 200],
          friction: 0.55,
          layoutAnimation: true,
        },
        label: {
          show: true,
          position: 'bottom',
          color: textColor,
          fontSize: 11,
          fontWeight: 500,
        },
        lineStyle: {
          color: accentPrimary,
          width: 1.8,
          opacity: 0.8,
          curveness: 0.12,
        },
        emphasis: {
          focus: 'adjacency',
          scale: true,
          lineStyle: { width: 4, opacity: 1 },
          label: { fontWeight: 'bold' },
        },
        edgeSymbol: ['none', 'none'],
        edgeLabel: { show: false },
      },
    ],
  }
}

async function renderChart(replace = false) {
  if (!chartRef.value || !props.data.characters.length || !echartsModule) return

  const token = ++renderToken
  const isDark = theme.value === 'dark'
  const relationLinesByChar = buildRelationLinesByChar()
  const avatarMap = await prepareCircularAvatars(relationLinesByChar, isDark)

  if (token !== renderToken) return

  if (!chart) {
    chart = echartsModule.init(chartRef.value, undefined, { renderer: 'canvas' })
  }

  chart.setOption(buildOption(avatarMap), replace || !hasOption)
  hasOption = true
}

onMounted(async () => {
  echartsModule = await import('echarts')
  await renderChart(true)

  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartRef.value)
  }
})

watch(
  () => props.data,
  async () => {
    hasOption = false
    await renderChart(true)
  },
  { deep: true },
)

watch(theme, async () => {
  await renderChart(false)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
  hasOption = false
})
</script>

<template>
  <div v-if="data.characters.length" class="graph-shell">
    <div ref="chartRef" class="graph-wrapper" role="img" aria-label="关系图谱" />
    <p class="graph-hint">滚轮缩放 · 拖拽画布平移 · 拖拽节点调整位置 · 圆形头像 · 悬浮查看详情</p>
  </div>
</template>

<style scoped>
.graph-shell {
  width: 100%;
}

.graph-wrapper {
  width: 100%;
  height: 480px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  touch-action: none;
}

.graph-hint {
  margin: 0.625rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

@media (max-width: 768px) {
  .graph-wrapper {
    height: 360px;
    border-radius: 16px;
  }
}
</style>
