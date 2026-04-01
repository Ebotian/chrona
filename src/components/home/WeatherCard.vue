<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sunrise,
  Sunset,
  Sun,
  Wind,
  Zap
} from 'lucide-vue-next'
import palette from '../../../design_doc/weather.json'

type WeatherScheme = {
  condition: string[]
  background: { gradient: string }
  text: { primary: string; secondary: string; hint: string; accent: string }
}

type WeatherEntry = {
  astronomy?: Array<{ sunrise?: string; sunset?: string }>
}

type WttrPayload = {
  current_condition?: Array<{
    temp_C?: string
    weatherDesc?: Array<{ value?: string }>
    humidity?: string
    windspeedKmph?: string
    winddir16Point?: string
  }>
  weather?: WeatherEntry[]
}

const props = withDefaults(
  defineProps<{
    cityEn?: string
    cityZh?: string
    timezone?: string
  }>(),
  {
    cityEn: 'Nanjing',
    cityZh: '南京',
    timezone: 'Asia/Shanghai'
  }
)

const schemes = palette.weatherSchemes as Record<string, WeatherScheme>
const weatherData = ref<WttrPayload | null>(null)
const isLoading = ref(false)
const errorText = ref('')
const now = ref(new Date())

let timer: ReturnType<typeof setInterval> | null = null

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function resolveScheme(condition: string): WeatherScheme {
  const target = normalize(condition)
  for (const [key, scheme] of Object.entries(schemes)) {
    if (key === 'default') continue
    const hit = scheme.condition.some((item) => target.includes(normalize(item)))
    if (hit) return scheme
  }
  return schemes.default
}

function resolveIcon(condition: string) {
  const text = normalize(condition)
  if (/(雷|thunder|lightning)/.test(text)) return Zap
  if (/(雨|drizzle|rain|shower)/.test(text)) return CloudRain
  if (/(雪|snow|sleet)/.test(text)) return CloudSnow
  if (/(雾|mist|fog|haze)/.test(text)) return CloudFog
  if (/(阴|多云|cloud|overcast)/.test(text)) return Cloud
  if (/(少云|晴间|partly|mostly sunny)/.test(text)) return CloudSun
  if (/(晴|clear|sunny|sun)/.test(text)) return Sun
  return CloudSun
}

async function fetchWeather(): Promise<void> {
  isLoading.value = true
  errorText.value = ''
  try {
    const url = `https://wttr.in/${encodeURIComponent(props.cityEn)}?format=j1&lang=zh`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as WttrPayload
    weatherData.value = data
  } catch (error) {
    errorText.value = '天气数据获取失败'
    console.error('[WeatherCard] fetch failed:', error)
  } finally {
    isLoading.value = false
  }
}

const currentCondition = computed(() => weatherData.value?.current_condition?.[0]?.weatherDesc?.[0]?.value ?? '晴')
const currentTemp = computed(() => `${weatherData.value?.current_condition?.[0]?.temp_C ?? '--'}°C`)
const sunrise = computed(() => weatherData.value?.weather?.[0]?.astronomy?.[0]?.sunrise ?? '--')
const sunset = computed(() => weatherData.value?.weather?.[0]?.astronomy?.[0]?.sunset ?? '--')
const humidity = computed(() => `${weatherData.value?.current_condition?.[0]?.humidity ?? '--'}%`)
const wind = computed(() => {
  const speed = weatherData.value?.current_condition?.[0]?.windspeedKmph ?? '--'
  return `${speed} km/h`
})

const currentIcon = computed(() => resolveIcon(currentCondition.value))
const activeScheme = computed(() => resolveScheme(currentCondition.value))

const themeVars = computed(() => ({
  '--wc-gradient': activeScheme.value.background.gradient,
  '--wc-text-primary': activeScheme.value.text.primary,
  '--wc-text-secondary': activeScheme.value.text.secondary,
  '--wc-text-hint': activeScheme.value.text.hint,
  '--wc-text-accent': activeScheme.value.text.accent
}))

onMounted(() => {
  fetchWeather()
  timer = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <article class="weather-card" :style="themeVars">
    <section class="now-panel">
      <header class="city-row">
        <h3 class="city-title">{{ props.cityEn }} {{ props.cityZh }}</h3>
      </header>

      <div class="main-row">
        <component :is="currentIcon" class="main-icon" />
        <div class="temp-time">
          <p class="temp">{{ currentTemp }}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <Sunrise class="meta-icon" />
          <span>{{ sunrise }}</span>
        </div>
        <div class="meta-item">
          <Sunset class="meta-icon" />
          <span>{{ sunset }}</span>
        </div>
        <div class="meta-item">
          <Wind class="meta-icon" />
          <span>{{ wind }}</span>
        </div>
        <div class="meta-item">
          <Droplets class="meta-icon" />
          <span>{{ humidity }}</span>
        </div>
      </div>

      <p v-if="errorText" class="status">{{ errorText }}</p>
      <p v-else-if="isLoading" class="status">正在更新天气…</p>
    </section>
  </article>
</template>

<style scoped>
.weather-card {
  --radius-lg: 14px;
  --radius-md: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: min(100%, 22rem);
  max-width: 100%;
  height: auto;
  min-height: 0;
  align-self: flex-start;
  padding: 0.375rem;
  box-sizing: border-box;
  color: var(--wc-text-primary);
}

.now-panel {
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--wc-text-accent) 35%, white);
  background: var(--wc-gradient);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, white 25%, transparent);
}

.now-panel {
  padding: 0.55rem 0.75rem;
}

.city-row {
  margin-bottom: 0.45rem;
}

.city-title {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: var(--wc-text-primary);
}

.main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.main-icon {
  width: 1.9rem;
  height: 1.9rem;
  color: var(--wc-text-accent);
  flex: 0 0 auto;
}

.temp-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.temp {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--wc-text-primary);
}


.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 0.55rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
  font-size: 0.7rem;
  color: var(--wc-text-secondary);
}

.meta-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--wc-text-accent);
  flex: 0 0 auto;
}

.status {
  margin: 0.45rem 0 0;
  font-size: 0.72rem;
  color: var(--wc-text-hint);
}
</style>
