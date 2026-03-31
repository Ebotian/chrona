import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addDays, startOfMonth, differenceInDays, parseISO, format } from 'date-fns'

function normalize(dateIso: string) {
  // Accept YYYY-MM-DD or full ISO, normalize to local YYYY-MM-DD
  try {
    const d = parseISO(dateIso)
    return format(d, 'yyyy-MM-dd')
  } catch (e) {
    return dateIso.slice(0, 10)
  }
}

function formatDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export const useTimeStore = defineStore('time', () => {
  const currentDate = ref<string>(format(new Date(), 'yyyy-MM-dd'))
  // const currentDate = ref<string>('2024-12-30')
  const viewportStart = ref<string | null>(null)
  const viewportEnd = ref<string | null>(null)
  const focusedDate = ref<string | null>(null)

  function setCurrentDate(dateIso: string) {
    currentDate.value = normalize(dateIso)
  }

  function setViewport(startIso: string, endIso: string) {
    viewportStart.value = normalize(startIso)
    viewportEnd.value = normalize(endIso)
  }

  function stepDay(delta: number) {
    const d = parseISO(currentDate.value)
    const next = addDays(d, delta)
    setCurrentDate(formatDate(next))
  }

  function alignToMonth(month: number, year: number) {
    const first = startOfMonth(new Date(year, month - 1))
    setCurrentDate(formatDate(first))
  }

  const yearProgress = computed(() => {
    try {
      const d = parseISO(currentDate.value)
      const start = new Date(d.getFullYear(), 0, 1)
      const end = new Date(d.getFullYear(), 11, 31)
      const total = differenceInDays(end, start) + 1
      const passed = differenceInDays(d, start)
      return Math.max(0, Math.min(1, passed / total))
    } catch (e) {
      return 0
    }
  })

  return {
    currentDate,
    viewportStart,
    viewportEnd,
    focusedDate,
    setCurrentDate,
    setViewport,
    stepDay,
    alignToMonth,
    yearProgress
  }
})
