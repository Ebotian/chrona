<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { useTimeStore } from '../../stores/time'
import type { ArticleMeta } from '../../lib/postParser'
import { useTimelineSyncState } from '../../lib/timelineSync'

type TimelineEntries = Record<string, ArticleMeta[]>
type EntriesInput = TimelineEntries | ArticleMeta[]

type VisibleBounds = {
  start: string
  end: string
}

type Direction = 'up' | 'down'

type RenderCell = {
  id: string
  title: string
  fullTitle: string
  meta: string
}

type RenderRow = {
  key: string
  lineY: number
  contentY: number
  contentLeft: number
  contentWidth: number
  opacity: number
  columns: number
  cells: RenderCell[]
}

const props = withDefaults(defineProps<{
  entries?: EntriesInput
  visibleBounds?: VisibleBounds | null
}>(), {
  entries: () => ([] as ArticleMeta[]),
  visibleBounds: null
})

const emit = defineEmits<{
  (e: 'tagClick', articleId: string): void
}>()

const store = useTimeStore()
const sync = useTimelineSyncState()
const DEBUG_SYNC = import.meta.env.DEV && (globalThis as { __TIMELINE_DEBUG__?: boolean }).__TIMELINE_DEBUG__ === true
const containerRef = ref<HTMLElement | null>(null)
const regionHeight = ref(0)
const regionWidth = ref(0)
const regionLeftGlobal = ref(0)
const regionTopGlobal = ref(0)
const syncedAxisXGlobal = ref<number | null>(null)
const syncedCenterYGlobal = ref<number | null>(null)
const syncedRowPitch = ref(30)
const syncedCenterIndexFloat = ref<number | null>(null)
const syncedVisibleDates = ref<string[]>([])
const syncedTimelineTopGlobal = ref<number | null>(null)
const syncedTimelineScrollTop = ref(0)
const syncedRowCenterOffset = ref(12)

const EDGE_FADE_BAND = 64
const ROW_SIDE_PADDING = 14
const LINE_MIN_LEFT = 0

let resizeObserver: ResizeObserver | null = null
const scrollDirection = ref<Direction>('up')
const lastCurrentDate = ref(store.currentDate)
let lastDebugLogAt = 0

const normalizedEntries = computed<TimelineEntries>(() => {
  if (Array.isArray(props.entries)) {
    const byDate: TimelineEntries = {}
    for (const article of props.entries) {
      if (!article.date) continue
      const date = article.date.slice(0, 10)
      if (!byDate[date]) byDate[date] = []
      if (byDate[date].length < 2) byDate[date].push(article)
    }
    return byDate
  }

  const byDate: TimelineEntries = {}
  for (const [date, rawList] of Object.entries(props.entries)) {
    const list = Array.isArray(rawList) ? rawList : []
    byDate[date] = list.slice(0, 2)
  }
  return byDate
})

const activeBounds = computed<VisibleBounds | null>(() => {
  if (props.visibleBounds) return props.visibleBounds
  if (store.viewportStart && store.viewportEnd) {
    return { start: store.viewportStart, end: store.viewportEnd }
  }
  return null
})

const visibleDays = computed<string[]>(() => {
  if (syncedVisibleDates.value.length > 0) {
    return syncedVisibleDates.value
  }
  const bounds = activeBounds.value
  if (!bounds) {
    const current = parseISO(store.currentDate)
    const first = format(new Date(current.getFullYear(), current.getMonth(), 1), 'yyyy-MM-dd')
    const last = format(new Date(current.getFullYear(), current.getMonth() + 1, 0), 'yyyy-MM-dd')
    return eachDayOfInterval({ start: parseISO(first), end: parseISO(last) })
      .map((d) => format(d, 'yyyy-MM-dd'))
      .reverse()
  }
  try {
    return eachDayOfInterval({ start: parseISO(bounds.start), end: parseISO(bounds.end) })
      .map((d) => format(d, 'yyyy-MM-dd'))
      .reverse()
  } catch {
    return []
  }
})

const currentIndex = computed(() => {
  const idx = visibleDays.value.findIndex((d) => d === store.currentDate)
  return idx >= 0 ? idx : Math.floor(visibleDays.value.length / 2)
})

const anchorIndex = computed(() => {
  if (typeof syncedCenterIndexFloat.value === 'number' && Number.isFinite(syncedCenterIndexFloat.value)) {
    return syncedCenterIndexFloat.value
  }
  return currentIndex.value
})

const axisAnchorX = computed(() => {
  if (syncedAxisXGlobal.value == null) return 0
  return syncedAxisXGlobal.value - regionLeftGlobal.value
})

const centerAnchorY = computed(() => {
  if (syncedCenterYGlobal.value == null) return regionHeight.value / 2
  return syncedCenterYGlobal.value - regionTopGlobal.value
})

const rowPitch = computed(() => syncedRowPitch.value || 30)

function syncFromBus() {
  syncedAxisXGlobal.value = sync.axisXGlobal.value
  syncedCenterYGlobal.value = sync.centerYGlobal.value
  syncedRowPitch.value = sync.rowPitch.value || 30
  syncedCenterIndexFloat.value = sync.centerIndexFloat.value
  syncedVisibleDates.value = [...sync.visibleDates.value]
  syncedTimelineTopGlobal.value = sync.timelineTopGlobal.value
  syncedTimelineScrollTop.value = sync.timelineScrollTop.value
  syncedRowCenterOffset.value = sync.rowCenterOffset.value
}

function measureRegionRect() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  regionLeftGlobal.value = rect.left
  regionTopGlobal.value = rect.top
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function calcOpacity(y: number): number {
  const topDistance = y
  const bottomDistance = regionHeight.value - y

  let topOpacity = 1
  if (topDistance < EDGE_FADE_BAND) {
    const p = clamp(topDistance / EDGE_FADE_BAND, 0, 1)
    topOpacity = scrollDirection.value === 'up' ? p : Math.pow(p, 0.72)
  }

  let bottomOpacity = 1
  if (bottomDistance < EDGE_FADE_BAND) {
    const p = clamp(bottomDistance / EDGE_FADE_BAND, 0, 1)
    bottomOpacity = scrollDirection.value === 'down' ? p : Math.pow(p, 0.72)
  }

  return clamp(Math.min(topOpacity, bottomOpacity), 0, 1)
}

function trimTitle(text: string): string {
  const maxChars = 18
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1)}…`
}

function articleMeta(article: ArticleMeta): string {
  if (article.date) return article.date.slice(0, 10)
  return article.slug
}

const rows = computed<RenderRow[]>(() => {
  const out: RenderRow[] = []
  const lineLeft = Math.min(Math.max(axisAnchorX.value, LINE_MIN_LEFT), regionWidth.value)
  const lineWidth = Math.max(0, regionWidth.value - lineLeft)
  const contentLeft = lineLeft + ROW_SIDE_PADDING
  const contentWidth = Math.max(0, lineWidth - ROW_SIDE_PADDING)

  for (const [dayIndexFromViewport, day] of visibleDays.value.entries()) {
    const list = normalizedEntries.value[day]
    if (!list || list.length === 0) continue

    const dayIndex = dayIndexFromViewport
    const lineY = syncedTimelineTopGlobal.value == null
      ? centerAnchorY.value + (dayIndex - anchorIndex.value) * rowPitch.value
      : (syncedTimelineTopGlobal.value - regionTopGlobal.value) + (dayIndex * rowPitch.value) + syncedRowCenterOffset.value - syncedTimelineScrollTop.value
    const contentY = lineY + rowPitch.value / 2
    const cells: RenderCell[] = list.map((a) => ({
      id: a.id,
      title: trimTitle(a.title),
      fullTitle: a.title,
      meta: articleMeta(a)
    }))

    out.push({
      key: day,
      lineY,
      contentY,
      contentLeft,
      contentWidth,
      opacity: calcOpacity(contentY),
      columns: Math.max(1, cells.length),
      cells
    })
  }

  return out
})

function debugTagRegion(label: string) {
  if (!DEBUG_SYNC) return
  const now = performance.now()
  if (now - lastDebugLogAt < 220) return
  lastDebugLogAt = now
  const sample = rows.value[0]
  // eslint-disable-next-line no-console
  console.log('[TagRegionSync]', label, {
    currentDate: store.currentDate,
    visibleFirst: visibleDays.value[0],
    visibleLast: visibleDays.value[visibleDays.value.length - 1],
    anchorIndex: Number(anchorIndex.value.toFixed(3)),
    rowPitch: Number(rowPitch.value.toFixed(3)),
    topTickYGlobal: sync.topTickYGlobal.value,
    sampleRow: sample
      ? {
        key: sample.key,
        lineY: Number(sample.lineY.toFixed(3)),
        contentY: Number(sample.contentY.toFixed(3)),
        firstMeta: sample.cells[0]?.meta
      }
      : null
  })
}

function onArticleClick(id: string): void {
  emit('tagClick', id)
}

watch(() => store.currentDate, (nextDate) => {
  const days = visibleDays.value
  const prev = days.findIndex((d) => d === lastCurrentDate.value)
  const next = days.findIndex((d) => d === nextDate)
  if (prev >= 0 && next >= 0 && prev !== next) {
    scrollDirection.value = next > prev ? 'up' : 'down'
  }
  lastCurrentDate.value = nextDate
})

watch(() => sync.version.value, () => {
  syncFromBus()
  measureRegionRect()
}, { flush: 'sync' })

watch(
  () => [store.currentDate, syncedCenterIndexFloat.value, sync.topTickYGlobal.value, syncedVisibleDates.value.length, rows.value.length],
  () => {
    debugTagRegion('state-change')
  },
  { flush: 'post' }
)

onMounted(() => {
  if (!containerRef.value) return
  const applySize = () => {
    if (!containerRef.value) return
    regionHeight.value = containerRef.value.clientHeight
    regionWidth.value = containerRef.value.clientWidth
    measureRegionRect()
  }
  applySize()
  syncFromBus()
  resizeObserver = new ResizeObserver(() => applySize())
  resizeObserver.observe(containerRef.value)
  window.addEventListener('resize', measureRegionRect)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  window.removeEventListener('resize', measureRegionRect)
  resizeObserver = null
})
</script>

<template>
  <section ref="containerRef" class="tag-region" aria-label="Timeline article region">
    <div
      v-for="row in rows"
      :key="`${row.key}-band`"
      class="row-band"
      :style="{
        top: `${row.lineY - (rowPitch / 2)}px`,
        left: `${row.contentLeft - ROW_SIDE_PADDING}px`,
        width: `${row.contentWidth + ROW_SIDE_PADDING}px`,
        height: `${rowPitch}px`,
        opacity: String(row.opacity),
        gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))`
      }"
    >
      <span class="row-line row-line-top" aria-hidden="true" />
      <span class="row-line row-line-bottom" aria-hidden="true" />
      <div class="row-content">
      <button
        v-for="(cell, idx) in row.cells"
        :key="cell.id"
        type="button"
        class="article-cell"
        :class="{ 'is-not-first': idx > 0 }"
        :title="cell.fullTitle"
        @click="onArticleClick(cell.id)"
      >
        <span class="cell-main">
          <span class="cell-title">{{ cell.title }}</span>
          <span class="cell-meta">{{ cell.meta }}</span>
        </span>
      </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tag-region {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: visible;
  overflow-y: hidden;
  box-sizing: border-box;
  isolation: isolate;
}

.row-band {
  position: absolute;
  z-index: 2;
  display: grid;
}

.row-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(70, 95, 130, 0.52);
}

.row-line-top {
  top: 0;
}

.row-line-bottom {
  bottom: 0;
}

.row-content {
  position: absolute;
  inset: 0;
  display: grid;
  gap: 0;
  align-items: stretch;
  z-index: 3;
}

.article-cell {
  border: none;
  background: transparent;
  padding: 0 1rem;
  margin: 0;
  text-align: left;
  cursor: pointer;
  color: #2376b7;
  height: 100%;
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.article-cell.is-not-first {
  border-left: 1px solid rgba(70, 95, 130, 0.45);
}

.cell-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.cell-title {
  font-size: 0.875rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-meta {
  font-size: 0.68rem;
  line-height: 1;
  opacity: 0.78;
  flex: 0 0 auto;
}

.article-cell:hover .cell-title,
.article-cell:focus-visible .cell-title {
  text-decoration: none;
}
</style>
