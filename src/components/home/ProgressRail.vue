<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '../../stores/time'

const store = useTimeStore()
const clamped = computed(() => {
  const v = Number(store.yearProgress) || 0
  return Math.max(0, Math.min(1, v))
})
</script>

<template>
  <div class="progress-rail" role="img" :aria-label="`year progress ${Math.round(clamped * 100)}%`">
    <div class="label">Y</div>
    <div class="rail">
      <div class="cover" :style="{ height: `${(1 - clamped) * 100}%` }" />
    </div>
  </div>
</template>

<style scoped>
.progress-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.label {
  text-align: center;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: inherit;
}

.rail {
  position: relative;
  width: 0.3125rem;
  height: 25vh;
  /* 1/4 of viewport height as design */
  min-height: 7.5rem;
  border-radius: 0.375rem;
  /* full spectrum from bottom -> top (desaturated for subtle appearance) */
  background: linear-gradient(to top,
      hsl(0 55% 50%) 0%,
      hsl(30 55% 50%) 15%,
      hsl(60 55% 50%) 30%,
      hsl(120 55% 42%) 45%,
      hsl(180 55% 45%) 60%,
      hsl(240 55% 45%) 75%,
      hsl(270 45% 50%) 100%);
  overflow: hidden;
}

/* Desaturating overlay for the unfilled area: same gradient but low saturation */
.cover {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 100%;
  /* sand-white for unfilled area */
  background: #F5F3E7;
  transition: height 240ms ease-out;
  pointer-events: none;
}
</style>