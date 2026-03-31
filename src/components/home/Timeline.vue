<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { eachDayOfInterval, parseISO, format, addDays } from 'date-fns'
import { useTimeStore } from '../../stores/time'

const props = defineProps({
  startDate: { type: String, default: () => format(new Date(), 'yyyy-MM-01') },
  endDate: { type: String, default: () => format(new Date(), 'yyyy-MM-dd') }
})

const emits = defineEmits(['dayFocus', 'dayStep'])

const store = useTimeStore()

const VISIBLE_DAYS = 31

function getIntervalFromStrings(startIso: string, endIso: string) {
  try {
    return { start: parseISO(startIso), end: parseISO(endIso) }
  } catch (e) {
    return null
  }
}

const days = computed(() => {
  try {
    let interval = null
    if (store.viewportStart && store.viewportEnd) {
      interval = getIntervalFromStrings(store.viewportStart, store.viewportEnd)
    }
    if (!interval) {
      interval = getIntervalFromStrings(props.startDate, props.endDate)
    }
    if (!interval) return []
    return eachDayOfInterval(interval).map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      day: Number(format(d, 'd')),
      dayLabel: format(d, 'dd')
    })).reverse()
  } catch (e) {
    return []
  }
})

const tickClass = (day: number) => {
  if (day % 10 === 0) return 'tick-long'
  if (day % 5 === 0) return 'tick-mid'
  return 'tick-short'
}

// Interaction tuning
let wheelAccumulatorDays = 0
const WHEEL_SENSITIVITY = 0.35
const MAX_STEPS_PER_WHEEL_EVENT = 3

const PIXELS_PER_DAY_FACTOR = 0.8
const INERTIA_MIN_VELOCITY_PX_PER_MS = 0.18
const INERTIA_DECAY_PER_FRAME = 0.60
const INERTIA_STOP_VELOCITY = 0.12

// Element refs & drag state
const container = ref<HTMLElement | null>(null)
let dragging = false
let startY = 0
let startIndex = 0
let lastFloatIndex = 0
let pendingRaf = false
let lastPositions: Array<{ t: number; y: number }> = []
let inertiaRaf = 0
let inertiaActive = false
let didLogInit = false
let aligned = false
let didLogMove = false
let wheelFirstLimited = true

function ensureAligned() {
  if (aligned) return
  try {
    const idx = days.value.findIndex(d => d.date === getCurrentDate())
    if (idx >= 0 && container.value) {
      const scrollTop = computeScrollTopForIndex(idx)
      container.value.scrollTop = scrollTop
      updateViewportCenterOn(days.value[idx].date)
      wheelAccumulatorDays = 0
      const rowHeight = getRowHeight()
      lastFloatIndex = (container.value.scrollTop + (container.value.clientHeight / 2) - rowHeight / 2) / rowHeight
      hoverIndex.value = idx
      lastHoverApplied = idx
    }
  } catch (e) { }
  aligned = true
}

// Local hover selection during drag — we will write to store for live UI updates
// but avoid forcing viewport recenter until pointerup.
const hoverIndex = ref<number | null>(null)
let lastHoverApplied = -1

// Helpers
function getCurrentDate(): string {
  const cur: any = (store as any).currentDate
  if (typeof cur === 'string') return cur
  if (cur && typeof cur.value === 'string') return cur.value
  return String(cur ?? '')
}

function clampIndex(i: number) {
  return Math.max(0, Math.min(days.value.length - 1, i))
}

// mode: 'center' => animation/keyboard/inertia semantics (nearest)
// mode: 'above'  => drag semantics (tick whose center is just above the red line)
function mapFloatToIndex(floatIndex: number, mode: 'center' | 'above' = 'center') {
  if (mode === 'above') {
    // pick the item whose center is above the overlay line: floor(floatIndex)
    return clampIndex(Math.floor(floatIndex))
  }
  return clampIndex(Math.round(floatIndex))
}

function getRowHeight() {
  const row = container.value?.querySelector('.tick-row') as HTMLElement | null
  if (!row) return 24
  const parent = row.parentElement as HTMLElement | null
  let gap = 0
  try {
    if (parent) {
      const style = getComputedStyle(parent)
      gap = parseFloat((style as any).rowGap || (style as any).gap || '0') || 0
    }
  } catch (e) {
    gap = 0
  }
  return row.offsetHeight + gap
}

function computeScrollTopForIndex(index: number) {
  const rowHeight = getRowHeight()
  const containerEl = container.value
  if (!containerEl) return 0
  const target = index * rowHeight - (containerEl.clientHeight / 2) + rowHeight / 2
  return Math.max(0, target)
}

function updateViewportCenterOn(dateIso: string | { value?: string }) {
  const iso = typeof dateIso === 'string' ? dateIso : (dateIso && (dateIso as any).value) || getCurrentDate()
  try {
    const center = parseISO(iso)
    const half = Math.floor((VISIBLE_DAYS - 1) / 2)
    const start = addDays(center, -half)
    const end = addDays(start, VISIBLE_DAYS - 1)
    store.setViewport(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  } catch (e) {
    // ignore
  }
}

// Movement primitives
function performMoveToIndex(targetIndex: number, duration = 200, postCallback?: () => void) {
  return smoothMoveToIndex(targetIndex, duration).then(() => {
    const finalDate = days.value[targetIndex]?.date
    if (finalDate) updateViewportCenterOn(finalDate)
    if (postCallback) postCallback()
  })
}

function smoothMoveToIndex(targetIndex: number, duration = 200): Promise<void> {
  return new Promise((resolve) => {
    const el = container.value
    if (!el) { resolve(); return }
    const elNN = el as HTMLElement
    let startScroll = elNN.scrollTop
    // if the container's scrollTop looks uninitialized (far from expected for currentDate),
    // snap it to the expected center so the first small step doesn't animate a huge distance.
    try {
      const curIdx = days.value.findIndex(d => d.date === getCurrentDate())
      if (curIdx >= 0) {
        const expected = computeScrollTopForIndex(curIdx)
        const rowHeight = getRowHeight()
        if (Math.abs(startScroll - expected) > rowHeight * 3) {
          elNN.scrollTop = expected
          startScroll = expected
          // also initialize float index state
          lastFloatIndex = (startScroll + (elNN.clientHeight / 2) - rowHeight / 2) / rowHeight
          aligned = true
        }
      }
    } catch (e) { }
    const endScroll = computeScrollTopForIndex(targetIndex)
    if (!didLogMove) { didLogMove = true }
    if (duration <= 0) {
      elNN.scrollTop = endScroll
      const idx = mapFloatToIndex(targetIndex, 'above')
      const target = days.value[idx]
      if (target) store.setCurrentDate(target.date)
      resolve()
      return
    }

    const startTime = performance.now()
    function easeOutQuad(t: number) { return t * (2 - t) }
    let lastRounded = -1
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration)
      const scroll = startScroll + (endScroll - startScroll) * easeOutQuad(t)
      elNN.scrollTop = scroll

      const rowHeight = getRowHeight()
      const floatIndexNow = (scroll + (elNN.clientHeight / 2) - rowHeight / 2) / rowHeight
      lastFloatIndex = floatIndexNow
      const rounded = mapFloatToIndex(floatIndexNow, 'above')
      if (rounded !== lastRounded) {
        lastRounded = rounded
        const target = days.value[rounded]
        if (target) store.setCurrentDate(target.date)
      }

      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

// Handlers
function handleWheel(e: WheelEvent) {
  ensureAligned()
  if (!didLogInit) {
    didLogInit = true
    try { const rowHeight = getRowHeight(); void rowHeight } catch (e) { }
  }
  // one-time raw wheel event log to diagnose first-interaction jumps
  if (!didLogMove) { didLogMove = true }
  const rowHeight = getRowHeight()
  const pixelsPerDay = rowHeight * PIXELS_PER_DAY_FACTOR
  // normalize wheel delta into fractional days to avoid pixel-unit startup spikes
  const deltaDays = (e.deltaY * WHEEL_SENSITIVITY) / pixelsPerDay
  wheelAccumulatorDays += deltaDays
  let steps = Math.trunc(Math.abs(wheelAccumulatorDays))
  if (steps <= 0) return
  const sign = wheelAccumulatorDays > 0 ? 1 : -1
  const limited = Math.min(steps, MAX_STEPS_PER_WHEEL_EVENT)
  // diagnostic: log the original computed steps (before we cap the first applied step)
  if (steps > 2 && !didLogMove) { didLogMove = true }
  let stepAmount = sign * limited
  // limit the very first wheel-triggered step to at most 1 to avoid large initial jumps
  if (wheelFirstLimited && Math.abs(stepAmount) > 1) {
    stepAmount = sign * 1
    wheelFirstLimited = false
  }
  const curIdx = days.value.findIndex(d => d.date === getCurrentDate())
  const targetIdx = Math.max(0, Math.min(days.value.length - 1, (curIdx >= 0 ? curIdx : 0) + stepAmount))
  // diagnostic: if a large step remains, log detailed state once
  if (Math.abs(stepAmount) > 2 && !didLogMove) { didLogMove = true }
  performMoveToIndex(targetIdx, 180, () => emits('dayStep', stepAmount))
  wheelAccumulatorDays -= stepAmount
}

function handleKey(e: KeyboardEvent) {
  ensureAligned()
  if (!didLogInit) {
    didLogInit = true
    try { const rowHeight = getRowHeight(); void rowHeight } catch (e) { }
  }
  if (e.key === 'ArrowDown') {
    const curIdx = days.value.findIndex(d => d.date === getCurrentDate())
    const target = Math.min(days.value.length - 1, (curIdx >= 0 ? curIdx : 0) + 1)
    performMoveToIndex(target, 160, () => emits('dayStep', 1))
  } else if (e.key === 'ArrowUp') {
    const curIdx = days.value.findIndex(d => d.date === getCurrentDate())
    const target = Math.max(0, (curIdx >= 0 ? curIdx : 0) - 1)
    performMoveToIndex(target, 160, () => emits('dayStep', -1))
  }
}

function onTickClick(date: string) {
  const idx = days.value.findIndex(d => d.date === date)
  if (idx < 0) return
  performMoveToIndex(idx, 220, () => emits('dayFocus', date))
}

function onPointerDown(e: PointerEvent) {
  ensureAligned()
  if (e.button !== 0) return
  if (!didLogInit) {
    didLogInit = true
    try { const rowHeight = getRowHeight(); void rowHeight } catch (e) { }
  }
  cancelInertia()
  dragging = true
  startY = e.clientY
  lastPositions = [{ t: Date.now(), y: e.clientY }]
  const idx = days.value.findIndex(d => d.date === getCurrentDate())
  startIndex = idx >= 0 ? idx : Math.floor(days.value.length / 2)
  hoverIndex.value = startIndex
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const rowHeight = getRowHeight()
  const dy = startY - e.clientY
  // use actual row height for pointer drag so floatIndex matches scroll geometry
  const pixelsPerDay = rowHeight
  const floatIndex = startIndex + dy / pixelsPerDay
  lastFloatIndex = floatIndex
  const now = Date.now()
  lastPositions.push({ t: now, y: e.clientY })
  if (lastPositions.length > 6) lastPositions.shift()

  if (pendingRaf) return
  pendingRaf = true
  requestAnimationFrame(() => {
    pendingRaf = false
    // map to tick above line for drag feedback
    const snapped = mapFloatToIndex(lastFloatIndex, 'above')
    hoverIndex.value = snapped
    // update store live (but do NOT call updateViewportCenterOn) so month/year reflect
    if (snapped >= 0 && days.value[snapped]) {
      if (snapped !== lastHoverApplied) {
        lastHoverApplied = snapped
        store.setCurrentDate(days.value[snapped].date)
      }
    }
    if (container.value) container.value.scrollTop = computeScrollTopForIndex(lastFloatIndex)
  })
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  // finalize selection from hoverIndex (or compute from lastFloatIndex)
  const chosen = hoverIndex.value ?? mapFloatToIndex(lastFloatIndex, 'above')

  if (typeof chosen === 'number' && days.value[chosen]) {
    store.setCurrentDate(days.value[chosen].date)
    emits('dayFocus', days.value[chosen].date)
  } else {
    emits('dayFocus', getCurrentDate())
  }

  // compute velocity for potential inertia
  if (lastPositions.length >= 2) {
    const last = lastPositions[lastPositions.length - 1]
    let first = lastPositions[0]
    for (let i = lastPositions.length - 2; i >= 0; i--) {
      if (last.t - lastPositions[i].t >= 60) { first = lastPositions[i]; break }
    }
    const dt = last.t - first.t || 1
    const dy = first.y - last.y
    const velocityPxPerMs = dy / dt
    const rowHeight = getRowHeight()
    // match pointer drag behavior by using rowHeight here too
    const pixelsPerDay = rowHeight
    if (Math.abs(velocityPxPerMs) >= INERTIA_MIN_VELOCITY_PX_PER_MS) {
      startInertia(velocityPxPerMs, pixelsPerDay)
      return
    }
  }

  // otherwise align to current store date
  const finalIdx = days.value.findIndex(d => d.date === getCurrentDate())
  if (finalIdx >= 0) performMoveToIndex(finalIdx, 220)
}

function cancelInertia() {
  if (inertiaRaf) { cancelAnimationFrame(inertiaRaf); inertiaRaf = 0 }
  inertiaActive = false
}

function startInertia(initialVelocityPxPerMs: number, pixelsPerDay: number) {
  cancelInertia()
  inertiaActive = true
  let v = initialVelocityPxPerMs
  let lastTime = Date.now()
  let floatIndex = lastFloatIndex || days.value.findIndex(d => d.date === getCurrentDate()) || 0
  const startFloatIndex = floatIndex
  const MAX_INERTIA_DAYS = 2

  function step() {
    if (!inertiaActive) return
    const now = Date.now()
    const dt = now - lastTime
    lastTime = now
    const deltaDays = (v * dt) / pixelsPerDay
    floatIndex += deltaDays
    const minAllowed = Math.max(0, startFloatIndex - MAX_INERTIA_DAYS)
    const maxAllowed = Math.min(days.value.length - 1, startFloatIndex + MAX_INERTIA_DAYS)
    if (floatIndex < minAllowed) { floatIndex = minAllowed; cancelInertia() }
    if (floatIndex > maxAllowed) { floatIndex = maxAllowed; cancelInertia() }

    const idx = mapFloatToIndex(floatIndex, 'above')
    const target = days.value[idx]
    if (target) {
      store.setCurrentDate(target.date)
      updateViewportCenterOn(target.date)
    }
    if (container.value) container.value.scrollTop = computeScrollTopForIndex(floatIndex)
    v *= Math.pow(INERTIA_DECAY_PER_FRAME, Math.max(1, dt / 16.67))
    if (Math.abs(v) <= INERTIA_STOP_VELOCITY) { cancelInertia(); return }
    inertiaRaf = requestAnimationFrame(step)
  }
  inertiaRaf = requestAnimationFrame(step)
}

onMounted(() => {
  window.addEventListener('wheel', handleWheel, { passive: true })
  window.addEventListener('keydown', handleKey)
  window.addEventListener('pointerdown', onPointerDown);
  // after first render, align viewport to current date to stabilize geometry
  (async () => {
    await nextTick()
    // wait one frame for fonts/layout to settle
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
    try {
      const idx = days.value.findIndex(d => d.date === getCurrentDate())
      if (idx >= 0 && container.value) {
        const scrollTop = computeScrollTopForIndex(idx)
        container.value.scrollTop = scrollTop
        // ensure store viewport consistent
        updateViewportCenterOn(days.value[idx].date)

        // reset interaction accumulators and initialize float index
        wheelAccumulatorDays = 0
        const rowHeight = getRowHeight()
        lastFloatIndex = (container.value.scrollTop + (container.value.clientHeight / 2) - rowHeight / 2) / rowHeight
        hoverIndex.value = idx
        lastHoverApplied = idx
        // apply scroll again next frame to be safe
        requestAnimationFrame(() => { if (container.value) container.value.scrollTop = scrollTop })
      }
    } catch (e) {
      // ignore
    }
  })()
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <div class="timeline-wrap">
    <div class="timeline" ref="container">
      <div class="axis">
        <ul class="ticks">
          <li v-for="d in days" :key="d.date" class="tick-row" @click="onTickClick(d.date)">
            <span class="day-label">{{ d.dayLabel }}</span>
            <span class="tick" :class="tickClass(d.day)" />
          </li>
        </ul>
      </div>
    </div>

    <!-- overlay that does not scroll: fixed horizontal indicator for current time -->
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
  /* align visually near the axis area */
  right: 0;
  height: 0.125rem;
  background: #d32f2f;
  /* red */
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 0.125rem rgba(211, 47, 47, 0.25);
}

/* hide scrollbar but keep scrolling */
.timeline {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE 10+ */
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
  /* 5.25rem */
  width: var(--axis-width);
  position: relative;
}

.axis::after {
  /* vertical connector line */
  content: '';
  position: absolute;
  left: var(--connector-left);
  top: 0;
  bottom: 0;
  width: 0.125rem;
  background: #1677b3;
  /* space gray */
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
  /* Use monospaced digits for strict vertical alignment */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  -moz-font-feature-settings: "tnum" 1;
  -webkit-font-feature-settings: "tnum" 1;
  font-feature-settings: "tnum" 1;
}

.tick {
  height: 0.1875rem;
  display: block;
  background: #1677b3;
  /* space gray */
  position: absolute;
  /* align tick's right edge to connector line */
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