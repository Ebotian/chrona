<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

// Global interaction: wheel and keyboard to step day
// Wheel accumulator to map pixel delta to full-day steps
let wheelAccumulator = 0

// Wheel sensitivity tuning: scale raw deltaY so minimal physical wheels don't jump many days
const WHEEL_SENSITIVITY = 0.35 // lower = less effect per wheel tick
const MAX_STEPS_PER_WHEEL_EVENT = 3

function handleWheel(e: WheelEvent) {
  // map wheel pixels to days using the same row height logic as drag
  const row = container.value?.querySelector('.tick-row') as HTMLElement | null
  const rowHeight = (row?.offsetHeight || 24) + 6
  const pixelsPerDay = rowHeight * PIXELS_PER_DAY_FACTOR

  // accumulate deltaY (positive = later/down)
  wheelAccumulator += e.deltaY * WHEEL_SENSITIVITY

  let steps = Math.trunc(Math.abs(wheelAccumulator) / pixelsPerDay)
  if (steps <= 0) return

  // limit per-event burst so a single wheel event can't jump an excessive number of days
  const sign = wheelAccumulator > 0 ? 1 : -1
  const limited = Math.min(steps, MAX_STEPS_PER_WHEEL_EVENT)
  const stepAmount = sign * limited
  // compute target index from current logical index
  const curIdx = days.value.findIndex(d => d.date === store.currentDate)
  const targetIdx = Math.max(0, Math.min(days.value.length - 1, (curIdx >= 0 ? curIdx : 0) + stepAmount))
  // animate movement and then recenter + emit
  smoothMoveToIndex(targetIdx, 180).then(() => {
    const finalDate = days.value[targetIdx]?.date
    if (finalDate) updateViewportCenterOn(finalDate)
    emits('dayStep', stepAmount)
  })
  // remove consumed pixels for the limited steps
  wheelAccumulator -= sign * limited * pixelsPerDay
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    // move one day down smoothly
    const curIdx = days.value.findIndex(d => d.date === store.currentDate)
    const target = Math.min(days.value.length - 1, (curIdx >= 0 ? curIdx : 0) + 1)
    smoothMoveToIndex(target, 160).then(() => {
      const finalDate = days.value[target]?.date
      if (finalDate) updateViewportCenterOn(finalDate)
      emits('dayStep', 1)
    })
  } else if (e.key === 'ArrowUp') {
    const curIdx = days.value.findIndex(d => d.date === store.currentDate)
    const target = Math.max(0, (curIdx >= 0 ? curIdx : 0) - 1)
    smoothMoveToIndex(target, 160).then(() => {
      const finalDate = days.value[target]?.date
      if (finalDate) updateViewportCenterOn(finalDate)
      emits('dayStep', -1)
    })
  }
}

function updateViewportCenterOn(dateIso: string | { value?: string }) {
  const iso = typeof dateIso === 'string' ? dateIso : (dateIso && (dateIso as any).value) || store.currentDate
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

function onTickClick(date: string) {
  const idx = days.value.findIndex(d => d.date === date)
  if (idx < 0) return
  // animate movement; after completion, recenter viewport and emit focus
  smoothMoveToIndex(idx, 220).then(() => {
    updateViewportCenterOn(date)
    emits('dayFocus', date)
  })
}

function getRowHeight() {
  const row = container.value?.querySelector('.tick-row') as HTMLElement | null
  return (row?.offsetHeight || 24) + 6
}

function computeScrollTopForIndex(index: number) {
  const rowHeight = getRowHeight()
  const containerEl = container.value
  if (!containerEl) return 0
  // target so that the row is centered in the container
  const target = index * rowHeight - (containerEl.clientHeight / 2) + rowHeight / 2
  return Math.max(0, target)
}

// Smoothly animate to a target index. Returns a Promise that resolves when animation completes.
function smoothMoveToIndex(targetIndex: number, duration = 200): Promise<void> {
  return new Promise((resolve) => {
    const el = container.value
    if (!el) { resolve(); return }
    const elNN = el as HTMLElement
    const startScroll = elNN.scrollTop
    const endScroll = computeScrollTopForIndex(targetIndex)
    if (duration <= 0) {
      elNN.scrollTop = endScroll
      const rounded = Math.round(targetIndex)
      const idx = Math.max(0, Math.min(days.value.length - 1, rounded))
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

      // compute fractional index corresponding to current scroll
      const rowHeight = getRowHeight()
      const floatIndexNow = (scroll + (elNN.clientHeight / 2) - rowHeight / 2) / rowHeight
      lastFloatIndex = floatIndexNow
      const rounded = Math.max(0, Math.min(days.value.length - 1, Math.round(floatIndexNow)))
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

onMounted(() => {
  window.addEventListener('wheel', handleWheel, { passive: true })
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('keydown', handleKey)
})

// Global drag support: map vertical pointer movement to day delta
const container = ref<HTMLElement | null>(null)
let dragging = false
let startY = 0
let startIndex = 0
let lastAppliedDelta = 0
let pendingRaf = false
let lastFloatIndex = 0
const PIXELS_PER_DAY_FACTOR = 0.8 // lower = more sensitive (smoother)
// inertia tracking
let lastPositions: Array<{ t: number; y: number }> = []
let inertiaRaf = 0
let inertiaActive = false
// Only start inertia for fairly quick flicks; raise threshold so small drags don't trigger
const INERTIA_MIN_VELOCITY_PX_PER_MS = 0.18 // px/ms (~180 px/s)
// Much stronger decay to reduce travel distance
const INERTIA_DECAY_PER_FRAME = 0.60 // multiplier per RAF frame (0-1)
// Stop when velocity small
const INERTIA_STOP_VELOCITY = 0.12 // px/ms

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  // cancel any running inertia when user starts a new drag
  cancelInertia()
  dragging = true
  startY = e.clientY
  lastAppliedDelta = 0
  const idx = days.value.findIndex(d => d.date === store.currentDate)
  startIndex = idx >= 0 ? idx : Math.floor(days.value.length / 2)
  // seed position history
  lastPositions = [{ t: Date.now(), y: e.clientY }]
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const row = container.value?.querySelector('.tick-row') as HTMLElement | null
  const rowHeight = (row?.offsetHeight || 24) + 6 // include gap fallback
  // invert dy so that dragging up (decreasing clientY) yields positive delta
  const dy = startY - e.clientY
  const pixelsPerDay = rowHeight * PIXELS_PER_DAY_FACTOR
  const floatIndex = startIndex + dy / pixelsPerDay
  lastFloatIndex = floatIndex

  // record recent positions for velocity estimation
  const now = Date.now()
  lastPositions.push({ t: now, y: e.clientY })
  // keep last ~6 samples
  if (lastPositions.length > 6) lastPositions.shift()

  if (pendingRaf) return
  pendingRaf = true
  requestAnimationFrame(() => {
    pendingRaf = false
    const rounded = Math.round(lastFloatIndex)
    if (rounded === lastAppliedDelta) return
    lastAppliedDelta = rounded
    const newIndex = Math.max(0, Math.min(days.value.length - 1, rounded))
    const target = days.value[newIndex]
    if (target) {
      // update logical current date but avoid forcing a viewport recenter during active drag
      store.setCurrentDate(target.date)
      // during drag, drive scrollTop directly for smooth follow; defer centering until release
      if (container.value) {
        container.value.scrollTop = computeScrollTopForIndex(lastFloatIndex)
      }
    }
  })
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  // emit final focus
  const cur = store.currentDate
  emits('dayFocus', typeof cur === 'string' ? cur : (cur && (cur as any).value) || '')

  // compute velocity from last positions and start inertia if fast enough
  if (lastPositions.length >= 2) {
    const last = lastPositions[lastPositions.length - 1]
    // choose a sample ~60-120ms earlier if available for stability
    let first = lastPositions[0]
    for (let i = lastPositions.length - 2; i >= 0; i--) {
      if (last.t - lastPositions[i].t >= 60) { first = lastPositions[i]; break }
    }
    const dt = last.t - first.t || 1
    const dy = first.y - last.y // note: first - last so positive when flicking up
    const velocityPxPerMs = dy / dt

    const row = container.value?.querySelector('.tick-row') as HTMLElement | null
    const rowHeight = (row?.offsetHeight || 24) + 6
    const pixelsPerDay = rowHeight * PIXELS_PER_DAY_FACTOR

    if (Math.abs(velocityPxPerMs) >= INERTIA_MIN_VELOCITY_PX_PER_MS) {
      // start inertia (already smooth per-frame)
      startInertia(velocityPxPerMs, pixelsPerDay)
      return
    }
  }

  // if we didn't start inertia, smoothly align to the final focused date
  const finalIdx = days.value.findIndex(d => d.date === store.currentDate)
  if (finalIdx >= 0) {
    smoothMoveToIndex(finalIdx, 220).then(() => {
      updateViewportCenterOn(store.currentDate)
      emits('dayFocus', store.currentDate)
    })
  }
}

function cancelInertia() {
  if (inertiaRaf) {
    cancelAnimationFrame(inertiaRaf)
    inertiaRaf = 0
  }
  inertiaActive = false
}

function startInertia(initialVelocityPxPerMs: number, pixelsPerDay: number) {
  cancelInertia()
  inertiaActive = true
  let v = initialVelocityPxPerMs // px per ms; positive = upward movement -> earlier dates
  let lastTime = Date.now()
  // begin from current float index
  let floatIndex = lastFloatIndex || days.value.findIndex(d => d.date === store.currentDate) || 0
  const startFloatIndex = floatIndex
  const MAX_INERTIA_DAYS = 2 // cap total inertia displacement to within +/- 2 days

  function step() {
    if (!inertiaActive) return
    const now = Date.now()
    const dt = now - lastTime
    lastTime = now

    // apply movement: deltaDays = v * dt / pixelsPerDay
    const deltaDays = (v * dt) / pixelsPerDay
    floatIndex += deltaDays

    // enforce max displacement relative to start
    const minAllowed = Math.max(0, startFloatIndex - MAX_INERTIA_DAYS)
    const maxAllowed = Math.min(days.value.length - 1, startFloatIndex + MAX_INERTIA_DAYS)
    if (floatIndex < minAllowed) {
      floatIndex = minAllowed
      cancelInertia()
    }
    if (floatIndex > maxAllowed) {
      floatIndex = maxAllowed
      cancelInertia()
    }

    const rounded = Math.round(floatIndex)
    const newIndex = Math.max(0, Math.min(days.value.length - 1, rounded))
    const target = days.value[newIndex]
    if (target) {
      store.setCurrentDate(target.date)
      updateViewportCenterOn(target.date)
    }

    // set intermediate scroll position for smooth per-frame motion
    if (container.value) {
      container.value.scrollTop = computeScrollTopForIndex(floatIndex)
    }

    // decay velocity per frame (stronger decay to reduce travel)
    v *= Math.pow(INERTIA_DECAY_PER_FRAME, Math.max(1, dt / 16.67))

    if (Math.abs(v) <= INERTIA_STOP_VELOCITY) {
      cancelInertia()
      return
    }

    inertiaRaf = requestAnimationFrame(step)
  }

  inertiaRaf = requestAnimationFrame(step)
}

onMounted(() => {
  window.addEventListener('pointerdown', onPointerDown)
})

onUnmounted(() => {
  window.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
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
</template>

<style scoped>
.timeline {
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
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
  --label-width: 28px;
  --label-gap: 8px;
  --max-tick: 40px;
  --axis-width: 120px;
  --connector-left: calc(var(--label-width) + var(--label-gap) + var(--max-tick) + 8px);
  /* 84px */
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
  width: 2px;
  background: #1677b3;
  /* space gray */
}

.ticks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tick-row {
  display: flex;
  align-items: center;
  position: relative;
  min-height: 24px;
}

.day-label {
  display: inline-block;
  width: var(--label-width);
  text-align: right;
  margin-right: var(--label-gap);
  font-size: 12px;
  color: #144a74;
  /* Use monospaced digits for strict vertical alignment */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  -moz-font-feature-settings: "tnum" 1;
  -webkit-font-feature-settings: "tnum" 1;
  font-feature-settings: "tnum" 1;
}

.tick {
  height: 3px;
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
  width: 18px;
  opacity: 0.9;
}

.tick-mid {
  width: 28px;
  opacity: 0.95;
}

.tick-long {
  width: 40px;
  opacity: 1;
}
</style>