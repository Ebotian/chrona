<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { useTimeStore } from '../../stores/time'
import type { ArticleMeta } from '../../lib/postParser'
import { useTimelineSyncState } from '../../lib/timelineSync'

type TimelineEntries = Record<string, ArticleMeta[]>
type EntriesInput = TimelineEntries | ArticleMeta[]
type VisibleBounds = { start: string; end: string }
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
  topY: number
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
const containerRef = ref<HTMLElement | null>(null)
const regionHeight = ref(0)
const regionWidth = ref(0)
const regionLeftGlobal = ref(0)
const regionTopGlobal = ref(0)
const monthPickerBottomLocal = ref(0)

const syncedAxisXGlobal = ref<number | null>(null)
const syncedCenterYGlobal = ref<number | null>(null)
const syncedMotionIndex = ref<number | null>(null)
const syncedRowPitch = ref(30)
const syncedVisibleDates = ref<string[]>([])

const EDGE_FADE_BAND = 64
const LINE_MIN_LEFT = 0

let resizeObserver: ResizeObserver | null = null
let pickerResizeObserver: ResizeObserver | null = null
const scrollDirection = ref<Direction>('up')
const lastCurrentDate = ref(store.currentDate)

function syncFromBus() {
  syncedAxisXGlobal.value = sync.axisXGlobal.value
  syncedCenterYGlobal.value = sync.centerYGlobal.value
  syncedMotionIndex.value = sync.motionIndex.value
  syncedRowPitch.value = sync.rowPitch.value || 30
  syncedVisibleDates.value = [...sync.visibleDates.value]
}

const normalizedEntries = computed<TimelineEntries>(() => {
  if (Array.isArray(props.entries)) {
    const byDate: TimelineEntries = {}
    for (const article of props.entries) {
      if (!article.date) continue
      const date = article.date.slice(0, 10)
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(article)
    }
    return byDate
  }
  const byDate: TimelineEntries = {}
  for (const [date, rawList] of Object.entries(props.entries)) {
    const list = Array.isArray(rawList) ? rawList : []
    byDate[date] = list
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
  if (syncedVisibleDates.value.length > 0) return syncedVisibleDates.value
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

const motionIndex = computed(() => {
  if (typeof syncedMotionIndex.value === 'number' && Number.isFinite(syncedMotionIndex.value)) {
    return syncedMotionIndex.value
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

function measureRegionRect() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  regionLeftGlobal.value = rect.left
  regionTopGlobal.value = rect.top
}

function measureMonthPickerBoundary() {
  const picker = document.querySelector('.tag-col .outside-box') as HTMLElement | null
  if (!picker) {
    monthPickerBottomLocal.value = 0
    return
  }
  const rect = picker.getBoundingClientRect()
  monthPickerBottomLocal.value = Math.max(0, rect.bottom - regionTopGlobal.value)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function calcOpacity(topY: number, bottomY: number): number {
  const topBoundary = monthPickerBottomLocal.value + 4
  const topDistance = topY - topBoundary
  const bottomDistance = regionHeight.value - bottomY
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
  const contentLeft = lineLeft
  const contentWidth = lineWidth

  for (const [dayIndex, day] of visibleDays.value.entries()) {
    const list = normalizedEntries.value[day]
    if (!list || list.length === 0) continue

    const lineY = centerAnchorY.value + (dayIndex - motionIndex.value) * rowPitch.value
    const cells: RenderCell[] = list.map((a) => ({
      id: a.id,
      title: trimTitle(a.title),
      fullTitle: a.title,
      meta: articleMeta(a)
    }))

    out.push({
      key: day,
      lineY,
      topY: lineY - rowPitch.value / 2,
      contentLeft,
      contentWidth,
      opacity: calcOpacity(lineY - rowPitch.value / 2, lineY + rowPitch.value / 2),
      columns: Math.max(1, cells.length),
      cells
    })
  }

  return out
})

const hasTenDayEmptyRun = computed(() => {
  const days = visibleDays.value
  if (days.length < 10) return false
  // sliding window of 10 days
  for (let i = 0; i <= days.length - 10; i++) {
    let ok = true
    for (let j = 0; j < 10; j++) {
      const d = days[i + j]
      const list = normalizedEntries.value[d]
      if (list && list.length > 0) { ok = false; break }
    }
    if (ok) return true
  }
  return false
})

const showEmptyMessage = computed(() => {
  // show when there's a 10-day empty run and there are no article rows in view
  return hasTenDayEmptyRun.value && rows.value.length === 0
})

function onArticleClick(id: string) {
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
  measureMonthPickerBoundary()
}, { flush: 'sync' })

onMounted(() => {
  if (!containerRef.value) return
  const applySize = () => {
    if (!containerRef.value) return
    regionHeight.value = containerRef.value.clientHeight
    regionWidth.value = containerRef.value.clientWidth
    measureRegionRect()
    measureMonthPickerBoundary()
  }
  applySize()
  syncFromBus()
  resizeObserver = new ResizeObserver(() => applySize())
  resizeObserver.observe(containerRef.value)
  const picker = document.querySelector('.tag-col .outside-box') as HTMLElement | null
  if (picker) {
    pickerResizeObserver = new ResizeObserver(() => measureMonthPickerBoundary())
    pickerResizeObserver.observe(picker)
  }
  window.addEventListener('resize', measureRegionRect)
  window.addEventListener('resize', measureMonthPickerBoundary)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  const picker = document.querySelector('.tag-col .outside-box') as HTMLElement | null
  if (pickerResizeObserver && picker) {
    pickerResizeObserver.unobserve(picker)
  }
  window.removeEventListener('resize', measureRegionRect)
  window.removeEventListener('resize', measureMonthPickerBoundary)
  resizeObserver = null
  pickerResizeObserver = null
})
</script>

<template>
  <section ref="containerRef" class="tag-region" aria-label="Timeline article region">
    <div v-for="row in rows" :key="`${row.key}-band`" class="row-band" :style="{
      top: `${row.topY}px`,
      left: `${row.contentLeft}px`,
      width: `${row.contentWidth}px`,
      height: `${rowPitch}px`,
      opacity: String(row.opacity),
      gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))`
    }">
      <span class="row-line row-line-top" aria-hidden="true" />
      <span class="row-line row-line-bottom" aria-hidden="true" />
      <div class="row-content" :style="{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }">
        <button v-for="(cell, idx) in row.cells" :key="cell.id" type="button" class="article-cell"
          :class="{ 'is-not-first': idx > 0 }" :title="cell.fullTitle" @click="onArticleClick(cell.id)">
          <span class="cell-main">
            <span class="cell-title">{{ cell.title }}</span>
            <span class="cell-meta">{{ cell.meta }}</span>
          </span>
        </button>
      </div>
    </div>
    <div class="empty-message"
      :style="{ opacity: showEmptyMessage ? 1 : 0, pointerEvents: showEmptyMessage ? 'auto' : 'none' }"
      :aria-hidden="!showEmptyMessage">
      <div class="empty-text">有的日子干净得像水一样</div>
      <div class="empty-text">不留下一丝回忆</div>
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
  height: 100%;
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

.empty-message {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 5;
  transition: opacity 500ms ease;
  opacity: 0;
  pointer-events: none;
  color: rgba(35, 118, 183, 0.95);
}

.empty-message .empty-text {
  font-size: 1rem;
  line-height: 1.3;
  user-select: none;
}

.empty-message .empty-text+.empty-text {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  opacity: 0.9;
}
</style>
