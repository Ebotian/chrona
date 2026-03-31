import { readonly, ref } from 'vue'

const axisXGlobal = ref<number | null>(null)
const timelineTopGlobal = ref<number | null>(null)
const centerYGlobal = ref<number | null>(null)
const rowPitch = ref(30)
const rowCenterOffset = ref(12)
const motionIndex = ref(0)
const visibleDates = ref<string[]>([])
const version = ref(0)

export function useTimelineSyncState() {
  return {
    axisXGlobal: readonly(axisXGlobal),
    timelineTopGlobal: readonly(timelineTopGlobal),
    centerYGlobal: readonly(centerYGlobal),
    rowPitch: readonly(rowPitch),
    rowCenterOffset: readonly(rowCenterOffset),
    motionIndex: readonly(motionIndex),
    visibleDates: readonly(visibleDates),
    version: readonly(version)
  }
}

export function publishTimelineSync(payload: {
  axisXGlobal?: number | null
  timelineTopGlobal?: number | null
  centerYGlobal?: number | null
  rowPitch?: number
  rowCenterOffset?: number
  motionIndex?: number
  visibleDates?: string[]
}) {
  if (typeof payload.axisXGlobal === 'number' || payload.axisXGlobal === null) {
    axisXGlobal.value = payload.axisXGlobal
  }
  if (typeof payload.timelineTopGlobal === 'number' || payload.timelineTopGlobal === null) {
    timelineTopGlobal.value = payload.timelineTopGlobal
  }
  if (typeof payload.centerYGlobal === 'number' || payload.centerYGlobal === null) {
    centerYGlobal.value = payload.centerYGlobal
  }
  if (typeof payload.rowPitch === 'number' && Number.isFinite(payload.rowPitch) && payload.rowPitch > 0) {
    rowPitch.value = payload.rowPitch
  }
  if (typeof payload.rowCenterOffset === 'number' && Number.isFinite(payload.rowCenterOffset) && payload.rowCenterOffset >= 0) {
    rowCenterOffset.value = payload.rowCenterOffset
  }
  if (typeof payload.motionIndex === 'number' && Number.isFinite(payload.motionIndex)) {
    motionIndex.value = payload.motionIndex
  }
  if (Array.isArray(payload.visibleDates)) {
    visibleDates.value = payload.visibleDates
  }
  version.value += 1
}
