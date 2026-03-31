import { readonly, ref } from 'vue'

const axisXGlobal = ref<number | null>(null)
const centerYGlobal = ref<number | null>(null)
const topTickYGlobal = ref<number | null>(null)
const timelineTopGlobal = ref<number | null>(null)
const timelineScrollTop = ref(0)
const rowCenterOffset = ref(12)
const rowPitch = ref(30)
const motionMs = ref(180)
const centerIndexFloat = ref<number | null>(null)
const topDateIso = ref<string | null>(null)
const visibleDates = ref<string[]>([])
const version = ref(0)

export function useTimelineSyncState() {
  return {
    axisXGlobal: readonly(axisXGlobal),
    centerYGlobal: readonly(centerYGlobal),
    topTickYGlobal: readonly(topTickYGlobal),
    timelineTopGlobal: readonly(timelineTopGlobal),
    timelineScrollTop: readonly(timelineScrollTop),
    rowCenterOffset: readonly(rowCenterOffset),
    rowPitch: readonly(rowPitch),
    motionMs: readonly(motionMs),
    centerIndexFloat: readonly(centerIndexFloat),
    topDateIso: readonly(topDateIso),
    visibleDates: readonly(visibleDates),
    version: readonly(version)
  }
}

export function publishTimelineSync(payload: {
  axisXGlobal?: number | null
  centerYGlobal?: number | null
  topTickYGlobal?: number | null
  timelineTopGlobal?: number | null
  timelineScrollTop?: number
  rowCenterOffset?: number
  rowPitch?: number
  motionMs?: number
  centerIndexFloat?: number | null
  topDateIso?: string | null
  visibleDates?: string[]
}) {
  if (typeof payload.axisXGlobal === 'number' || payload.axisXGlobal === null) {
    axisXGlobal.value = payload.axisXGlobal
  }
  if (typeof payload.centerYGlobal === 'number' || payload.centerYGlobal === null) {
    centerYGlobal.value = payload.centerYGlobal
  }
  if (typeof payload.topTickYGlobal === 'number' || payload.topTickYGlobal === null) {
    topTickYGlobal.value = payload.topTickYGlobal
  }
  if (typeof payload.timelineTopGlobal === 'number' || payload.timelineTopGlobal === null) {
    timelineTopGlobal.value = payload.timelineTopGlobal
  }
  if (typeof payload.timelineScrollTop === 'number' && Number.isFinite(payload.timelineScrollTop)) {
    timelineScrollTop.value = payload.timelineScrollTop
  }
  if (typeof payload.rowCenterOffset === 'number' && Number.isFinite(payload.rowCenterOffset) && payload.rowCenterOffset >= 0) {
    rowCenterOffset.value = payload.rowCenterOffset
  }
  if (typeof payload.rowPitch === 'number' && Number.isFinite(payload.rowPitch) && payload.rowPitch > 0) {
    rowPitch.value = payload.rowPitch
  }
  if (typeof payload.motionMs === 'number' && Number.isFinite(payload.motionMs) && payload.motionMs > 0) {
    motionMs.value = payload.motionMs
  }
  if (typeof payload.centerIndexFloat === 'number' && Number.isFinite(payload.centerIndexFloat)) {
    centerIndexFloat.value = payload.centerIndexFloat
  } else if (payload.centerIndexFloat === null) {
    centerIndexFloat.value = null
  }
  if (typeof payload.topDateIso === 'string' || payload.topDateIso === null) {
    topDateIso.value = payload.topDateIso
  }
  if (Array.isArray(payload.visibleDates)) {
    visibleDates.value = payload.visibleDates
  }
  version.value += 1
}
