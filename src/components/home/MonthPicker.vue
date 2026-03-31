<script setup lang="ts">

const props = defineProps({
  month: { type: Number, default: () => new Date().getMonth() + 1 }, // 1-12
  year: { type: Number, default: () => new Date().getFullYear() }
})

const emits = defineEmits(['change'])

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
  emits('change', { month: m, year: props.year })
}

function onYearChange(e: Event) {
  const y = Number((e.target as HTMLSelectElement).value)
  emits('change', { month: props.month, year: y })
}
</script>

<template>
  <div class="outside-box">
    <div class="left" role="group" aria-label="Month picker">
      <select class="mp-select mp-month" :value="props.month" @change="onMonthChange" aria-label="Month">
        <option v-for="m in months" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
      </select>
      <span class="sep">|</span>
      <select class="mp-select mp-year" :value="props.year" @change="onYearChange" aria-label="Year">
        <option v-for="y in yearRange" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div class="right" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.outside-box {
  display: flex;
  align-items: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px 6px 0;
}

.left {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #1772b4;
  border-radius: 6px;
  background: transparent;
  color: #000035;
  font-size: 13px;
  box-sizing: border-box;
  flex: 0 0 auto;
}

.mp-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  background-image: none;
  border: none;
  color: inherit;
  font: inherit;
  padding: 0;
  margin: 0;
}

/* 保留可见的焦点状态（可选） */
.mp-select:focus {
  outline: 2px solid rgba(23, 114, 180, 0.18);
  outline-offset: 2px;
}


.right {
  flex: 1 1 0;
  /* 固定宽度占位（改数字会把可见框整体向左/右微调） */
  height: 100%;
  pointer-events: none;
  background: transparent;
}
</style>