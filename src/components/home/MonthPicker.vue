<script setup lang="ts">
import { computed } from 'vue'
import {
  addDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek
} from 'date-fns'
import { useTimeStore } from '../../stores/time'
import { loadPostsFromClient } from '../../lib/postClientLoader'

const emits = defineEmits(['change'])
const store = useTimeStore()
const posts = loadPostsFromClient()

const selectedMonth = computed(() => {
  try {
    const d = new Date(store.currentDate)
    return d.getMonth() + 1
  } catch {
    return new Date().getMonth() + 1
  }
})

const selectedYear = computed(() => {
  try {
    const d = new Date(store.currentDate)
    return d.getFullYear()
  } catch {
    return new Date().getFullYear()
  }
})

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const yearRange = (() => {
  const cur = new Date().getFullYear()
  const start = cur - 5
  const end = cur + 5
  const arr: number[] = []
  for (let y = start; y <= end; y++) arr.push(y)
  return arr
})()

function onMonthChange(e: Event) {
  const m = Number((e.target as HTMLSelectElement).value)
  store.alignToMonth(m, selectedYear.value)
  emits('change', { month: m, year: selectedYear.value })
}

function onYearChange(e: Event) {
  const y = Number((e.target as HTMLSelectElement).value)
  store.alignToMonth(selectedMonth.value, y)
  emits('change', { month: selectedMonth.value, year: y })
}

const dateCountMap = computed(() => {
  const map = new Map<string, number>()
  for (const p of posts) {
    if (!p.date) continue
    const d = p.date.slice(0, 10)
    map.set(d, (map.get(d) ?? 0) + 1)
  }
  return map
})

type HeatWeek = {
  weekStart: Date
  jumpDate: Date
  total: number
  isCurrentWeek: boolean
  isFutureWeek: boolean
}

const weeks = computed<HeatWeek[]>(() => {
  const year = selectedYear.value
  const selectedMonthValue = selectedMonth.value
  const halfStartMonth = selectedMonthValue <= 6 ? 0 : 6
  const halfEndMonth = selectedMonthValue <= 6 ? 5 : 11
  const halfStart = new Date(year, halfStartMonth, 1)
  const halfEnd = endOfMonth(new Date(year, halfEndMonth, 1))
  const firstWeekStart = startOfWeek(halfStart, { weekStartsOn: 0 })
  const currentDate = parseISO(store.currentDate)
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

  const result: HeatWeek[] = []
  for (let index = 0; index < 26; index += 1) {
    const wk = addDays(firstWeekStart, index * 7)
    const dayCounts = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(wk, i)
      if (!isWithinInterval(day, { start: halfStart, end: halfEnd })) return 0
      return dateCountMap.value.get(format(day, 'yyyy-MM-dd')) ?? 0
    })
    const total = dayCounts.reduce((acc, n) => acc + n, 0)
    const jumpDate = wk < halfStart ? halfStart : (wk > halfEnd ? halfEnd : wk)
    const isCurrentWeek = isWithinInterval(currentDate, { start: wk, end: addDays(wk, 6) }) &&
      isWithinInterval(currentDate, { start: halfStart, end: halfEnd })
    const isFutureWeek = wk > currentWeekStart
    result.push({
      weekStart: wk,
      jumpDate,
      total,
      isCurrentWeek,
      isFutureWeek
    })
  }
  return result
})

const maxBucket = computed(() => {
  let m = 0
  for (const w of weeks.value) {
    m = Math.max(m, w.total)
  }
  return m
})

function bucketLevel(v: number): number {
  if (v <= 0 || maxBucket.value <= 0) return 0
  return 1
}

function onWeekClick(week: HeatWeek) {
  const iso = format(week.jumpDate, 'yyyy-MM-dd')
  store.setCurrentDate(iso)
  emits('change', { month: week.jumpDate.getMonth() + 1, year: week.jumpDate.getFullYear() })
}
</script>

<template>
  <div class="outside-box">
    <div class="left" role="group" aria-label="Month picker">
      <select class="mp-select mp-month" :value="selectedMonth" @change="onMonthChange" aria-label="Month">
        <option v-for="m in months" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
      </select>
      <span class="sep">|</span>
      <select class="mp-select mp-year" :value="selectedYear" @change="onYearChange" aria-label="Year">
        <option v-for="y in yearRange" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div class="right">
        <div class="right-frame">
        <div class="heatmap" role="list" aria-label="Half-year publishing heatmap">
          <button
            v-for="w in weeks"
            :key="format(w.weekStart, 'yyyy-MM-dd')"
            type="button"
            class="week-cell"
            :class="[
              w.isCurrentWeek ? 'lv-current' : (w.isFutureWeek ? 'lv-future' : `lv-${bucketLevel(w.total)}`)
            ]"
            :title="`${format(w.weekStart, 'yyyy-MM-dd')} (total: ${w.total})`"
            @click="onWeekClick(w)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.outside-box {
  --picker-height: 2.625rem;
  --heat-gap: 0.16rem;
  --heat-cell: calc((var(--picker-height) - var(--heat-gap)) / 2);
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: stretch;
  gap: 0.625rem;
  padding: 0.375rem 0.625rem 0.375rem 0;
}

.left {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  border: 0.0625rem solid #1772b4;
  border-radius: 0.375rem;
  background: transparent;
  color: #000035;
  font-size: 0.8125rem;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: var(--picker-height);
}

.mp-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  padding: 0;
  margin: 0;
}

.mp-select:focus {
  outline: 0.125rem solid rgba(23, 114, 180, 0.18);
  outline-offset: 0.125rem;
}

.right {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  overflow: hidden;
  height: var(--picker-height);
}

.right-frame {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
}

.heatmap {
  display: grid;
  grid-template-columns: repeat(13, var(--heat-cell));
  grid-template-rows: repeat(2, var(--heat-cell));
  grid-auto-flow: column;
  gap: var(--heat-gap);
  align-items: stretch;
  justify-content: end;
  width: max-content;
  max-width: 100%;
  height: var(--picker-height);
  align-content: stretch;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0;
}

.week-cell {
  width: var(--heat-cell);
  height: var(--heat-cell);
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  border-radius: 0.12rem;
  background: #d8dde3;
}
.week-cell:not(:disabled):hover {
  opacity: 0.7;
}


.week-cell.lv-1 {
  background: #34a853;
}

.week-cell.lv-current {
  background: #ff8c00;
}

.week-cell.lv-future {
  background: #b2bbbe;
}
</style>
