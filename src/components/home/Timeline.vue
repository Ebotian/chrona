<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns'
import { gsap } from 'gsap'
import { useTimeStore } from '../../stores/time'
import { publishTimelineSync } from '../../lib/timelineSync'

const props = defineProps({
  startDate: { type: String, default: () => format(new Date(), 'yyyy-MM-01') },
  endDate: { type: String, default: () => format(new Date(), 'yyyy-MM-dd') },
  externalJumpToken: { type: Number, default: 0 }
})

const emits = defineEmits(['dayFocus', 'dayStep'])
const store = useTimeStore()
const container = ref<HTMLElement | null>(null)

const VISIBLE_DAYS = 31
const WHEEL_SENSITIVITY = 0.32
const MAX_STEPS_PER_WHEEL_EVENT = 3

let internalDateWriteDepth = 0
let wheelAccumulatorDays = 0
let dragging = false
let dragStartY = 0
let dragStartScrollTop = 0
let tagRegionEl: HTMLElement | null = null
let tagRegionObserver: MutationObserver | null = null

function withInternalDateWrite(fn: () => void) {
  internalDateWriteDepth += 1
  try {
    fn()
  } finally {
    internalDateWriteDepth = Math.max(0, internalDateWriteDepth - 1)
  }
}

function isInternalDateWrite() {
  return internalDateWriteDepth > 0 || dragging
}

function getIntervalFromStrings(startIso: string, endIso: string) {
  try {
    return { start: parseISO(startIso), end: parseISO(endIso) }
  } catch {
    return null
  }
}

const days = computed(() => {
  try {
    let interval = null
    if (store.viewportStart && store.viewportEnd) {
      interval = getIntervalFromStrings(store.viewportStart, store.viewportEnd)
    }
    if (!interval) interval = getIntervalFromStrings(props.startDate, props.endDate)
    if (!interval) return []
    return eachDayOfInterval(interval).map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      day: Number(format(d, 'd')),
      dayLabel: format(d, 'dd')
    })).reverse()
  } catch {
    return []
  }
})

const tickClass = (day: number) => {
  if (day % 10 === 0) return 'tick-long'
  if (day % 5 === 0) return 'tick-mid'
  return 'tick-short'
}

function getCurrentDate(): string {
  const cur: any = (store as any).currentDate
  if (typeof cur === 'string') return cur
  if (cur && typeof cur.value === 'string') return cur.value
  return String(cur ?? '')
}

function getRowHeight() {
  const row = container.value?.querySelector('.tick-row') as HTMLElement | null
  if (!row) return 24
  const parent = row.parentElement as HTMLElement | null
  let gap = 0
  if (parent) {
    const style = getComputedStyle(parent)
    gap = parseFloat((style as any).rowGap || (style as any).gap || '0') || 0
  }
  return row.offsetHeight + gap
}

function motionIndexFromScroll(scrollTop: number): number {
  const el = container.value
  if (!el) return 0
  const rowHeight = getRowHeight()
  return (scrollTop + (el.clientHeight / 2) - rowHeight / 2) / rowHeight
}

function scrollTopForIndex(index: number): number {
  const el = container.value
  if (!el) return 0
  const rowHeight = getRowHeight()
  return Math.max(0, index * rowHeight - (el.clientHeight / 2) + rowHeight / 2)
}

function clampIndex(i: number): number {
  return Math.max(0, Math.min(days.value.length - 1, i))
}

function publishSnapshot() {
  const el = container.value
  if (!el) return
  const rowHeight = getRowHeight()
  const axisEl = el.querySelector('.axis') as HTMLElement | null
  const axisRect = axisEl?.getBoundingClientRect()
  const axisStyle = axisEl ? getComputedStyle(axisEl) : null
  const connectorLeft = axisStyle ? parseFloat(axisStyle.getPropertyValue('--connector-left').trim() || '0') : 0
  const axisX = axisRect && Number.isFinite(connectorLeft) ? axisRect.left + connectorLeft : null
  const rect = el.getBoundingClientRect()
  const motion = motionIndexFromScroll(el.scrollTop)

  publishTimelineSync({
    axisXGlobal: axisX,
    timelineTopGlobal: rect.top,
    centerYGlobal: rect.top + (el.clientHeight / 2),
    rowPitch: rowHeight,
    rowCenterOffset: rowHeight / 2,
    motionIndex: motion,
    visibleDates: days.value.map(d => d.date)
  })
}

function centerViewportOn(dateIso: string) {
  try {
    const center = parseISO(dateIso)
    const half = Math.floor((VISIBLE_DAYS - 1) / 2)
    const start = addDays(center, -half)
    const end = addDays(start, VISIBLE_DAYS - 1)
    store.setViewport(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  } catch {
    // ignore
  }
}

function applyDateFromCurrentScroll() {
  const el = container.value
  if (!el || days.value.length === 0) return
  const idx = clampIndex(Math.round(motionIndexFromScroll(el.scrollTop)))
  const date = days.value[idx]?.date
  if (!date) return
  if (date !== getCurrentDate()) {
    withInternalDateWrite(() => store.setCurrentDate(date))
  }
}

async function jumpToDateInstant(dateIso: string) {
  centerViewportOn(dateIso)
  await nextTick()
  const idx = days.value.findIndex(d => d.date === dateIso)
  if (idx < 0 || !container.value) return
  gsap.killTweensOf(container.value, 'scrollTop')
  container.value.scrollTop = scrollTopForIndex(idx)
  publishSnapshot()
}

function animateToIndex(targetIndex: number, duration = 0.2, onDone?: () => void) {
  const el = container.value
  if (!el) return
  const idx = clampIndex(targetIndex)
  const targetTop = scrollTopForIndex(idx)
  const targetDate = days.value[idx]?.date
  gsap.killTweensOf(el, 'scrollTop')
  gsap.to(el, {
    scrollTop: targetTop,
    duration,
    ease: 'power2.out',
    overwrite: 'auto',
    onUpdate: () => {
      publishSnapshot()
      applyDateFromCurrentScroll()
    },
    onComplete: () => {
      if (targetDate) {
        withInternalDateWrite(() => store.setCurrentDate(targetDate))
        void jumpToDateInstant(targetDate).then(() => {
          if (onDone) onDone()
        })
        return
      } else {
        publishSnapshot()
      }
      if (onDone) onDone()
    }
  })
}

function stepBy(delta: number) {
  const el = container.value
  if (!el || days.value.length === 0) return
  const base = clampIndex(Math.round(motionIndexFromScroll(el.scrollTop)))
  const target = clampIndex(base + delta)
  animateToIndex(target, 0.18, () => emits('dayStep', delta))
}

function onWheel(e: WheelEvent) {
  const rowHeight = getRowHeight()
  const deltaDays = (e.deltaY * WHEEL_SENSITIVITY) / rowHeight
  if (wheelAccumulatorDays !== 0 && Math.sign(deltaDays) !== Math.sign(wheelAccumulatorDays) && Math.abs(deltaDays) < 0.45) {
    wheelAccumulatorDays = 0
  }
  wheelAccumulatorDays += deltaDays
  const steps = Math.trunc(Math.abs(wheelAccumulatorDays))
  if (steps <= 0) return
  const sign = wheelAccumulatorDays > 0 ? 1 : -1
  const stepAmount = sign * Math.min(steps, MAX_STEPS_PER_WHEEL_EVENT)
  wheelAccumulatorDays -= stepAmount
  stepBy(stepAmount)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    stepBy(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    stepBy(-1)
  }
}

function onTickClick(date: string) {
  const idx = days.value.findIndex(d => d.date === date)
  if (idx < 0) return
  animateToIndex(idx, 0.22, () => emits('dayFocus', date))
}

function onPointerDown(e: PointerEvent) {
  if (!container.value || e.button !== 0) return
  dragging = true
  gsap.killTweensOf(container.value, 'scrollTop')
  dragStartY = e.clientY
  dragStartScrollTop = container.value.scrollTop
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging || !container.value) return
  const dy = e.clientY - dragStartY
  container.value.scrollTop = Math.max(0, dragStartScrollTop - dy)
  publishSnapshot()
  applyDateFromCurrentScroll()
}

function onPointerUp() {
  if (!dragging || !container.value) return
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  const idx = clampIndex(Math.round(motionIndexFromScroll(container.value.scrollTop)))
  const date = days.value[idx]?.date
  animateToIndex(idx, 0.14, () => {
    if (date) emits('dayFocus', date)
  })
}

function onTagRegionWheel(e: WheelEvent) {
  e.preventDefault()
  onWheel(e)
}

function onTagRegionPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement | null
  if (target && target.closest('button, a, input, select, textarea, label')) return
  onPointerDown(e)
}

function bindTagRegionInteractions() {
  const target = document.querySelector('.tag-region') as HTMLElement | null
  if (!target) return
  if (tagRegionEl === target) return
  unbindTagRegionInteractions()
  tagRegionEl = target
  tagRegionEl.addEventListener('wheel', onTagRegionWheel, { passive: false })
  tagRegionEl.addEventListener('pointerdown', onTagRegionPointerDown)
}

function unbindTagRegionInteractions() {
  if (!tagRegionEl) return
  tagRegionEl.removeEventListener('wheel', onTagRegionWheel)
  tagRegionEl.removeEventListener('pointerdown', onTagRegionPointerDown)
  tagRegionEl = null
}

function startTagRegionObserver() {
  if (tagRegionObserver) return
  tagRegionObserver = new MutationObserver(() => {
    bindTagRegionInteractions()
  })
  tagRegionObserver.observe(document.body, { childList: true, subtree: true })
}

function stopTagRegionObserver() {
  if (!tagRegionObserver) return
  tagRegionObserver.disconnect()
  tagRegionObserver = null
}

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  await nextTick()
  bindTagRegionInteractions()
  startTagRegionObserver()
  await jumpToDateInstant(getCurrentDate())
  publishSnapshot()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  unbindTagRegionInteractions()
  stopTagRegionObserver()
  if (container.value) gsap.killTweensOf(container.value, 'scrollTop')
})

watch(() => store.currentDate, async (nextDate) => {
  if (isInternalDateWrite()) return
  await jumpToDateInstant(nextDate)
})

watch(() => props.externalJumpToken, async () => {
  await jumpToDateInstant(getCurrentDate())
})

watch(days, async () => {
  await nextTick()
  publishSnapshot()
}, { flush: 'post' })
</script>

<template>
  <div class="timeline-wrap">
    <div class="timeline" ref="container" @wheel.prevent="onWheel" @pointerdown="onPointerDown">
      <div class="axis">
        <ul class="ticks">
          <li v-for="d in days" :key="d.date" class="tick-row" @click="onTickClick(d.date)">
            <span class="day-label">{{ d.dayLabel }}</span>
            <span class="tick" :class="tickClass(d.day)" />
          </li>
        </ul>
      </div>
    </div>

    <div class="timeline-overlay" aria-hidden="true">
      <div class="current-line" />
    </div>
  </div>
</template>

<style scoped>
.timeline {
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  scroll-behavior: auto;
  user-select: none;
}

.timeline-wrap {
  position: relative;
  height: 100%;
}

.timeline-overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.current-line {
  position: absolute;
  left: 0.75rem;
  right: 0;
  height: 0.125rem;
  background: #d32f2f;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 0.125rem rgba(211, 47, 47, 0.25);
}

.timeline {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.timeline::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.axis {
  --label-width: 1.75rem;
  --label-gap: 0.5rem;
  --max-tick: 2.5rem;
  --axis-width: 7.5rem;
  --connector-left: calc(var(--label-width) + var(--label-gap) + var(--max-tick) + 0.5rem);
  width: var(--axis-width);
  position: relative;
}

.axis::after {
  content: '';
  position: absolute;
  left: var(--connector-left);
  top: 0;
  bottom: 0;
  width: 0.125rem;
  background: #1677b3;
}

.ticks {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tick-row {
  display: flex;
  align-items: center;
  position: relative;
  min-height: 1.5rem;
}

.day-label {
  display: inline-block;
  width: var(--label-width);
  text-align: right;
  margin-right: var(--label-gap);
  font-size: 0.75rem;
  color: #144a74;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

.tick {
  height: 0.1875rem;
  display: block;
  background: #1677b3;
  position: absolute;
  right: calc(var(--axis-width) - var(--connector-left));
  top: 50%;
  transform: translateY(-50%);
}

.tick-short {
  width: 1.125rem;
  opacity: 0.9;
}

.tick-mid {
  width: 1.75rem;
  opacity: 0.95;
}

.tick-long {
  width: 2.5rem;
  opacity: 1;
}
</style>
