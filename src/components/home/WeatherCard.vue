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

type OpenMeteoPayload = {
  current?: {
    time?: string
    temperature_2m?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
    wind_direction_10m?: number
    weather_code?: number
    is_day?: number
  }
  daily?: {
    sunrise?: string[]
    sunset?: string[]
  }
}

const props = withDefaults(
  defineProps<{
    cityEn?: string
    cityZh?: string
    timezone?: string
    latitude?: number
    longitude?: number
  }>(),
  {
    cityEn: 'Nanjing',
    cityZh: '南京',
    timezone: 'Asia/Shanghai',
    latitude: 32.0603,
    longitude: 118.7969
  }
)

const schemes = palette.weatherSchemes as Record<string, WeatherScheme>
const weatherData = ref<OpenMeteoPayload | null>(null)
const isLoading = ref(false)
const errorText = ref('')

let refreshTimer: number | null = null

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function getTimezoneHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: props.timezone,
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
  const hourPart = parts.find((part) => part.type === 'hour')?.value
  const hour = hourPart ? Number(hourPart) : Number.NaN
  return Number.isFinite(hour) ? hour : date.getHours()
}

function isNightRefreshTime(date = new Date()): boolean {
  const hour = getTimezoneHour(date)
  return hour >= 23 || hour < 8
}

function getRefreshDelayMs(date = new Date()): number {
  return isNightRefreshTime(date) ? 30 * 60 * 1000 : 5 * 60 * 1000
}

function scheduleNextRefresh() {
  clearRefreshTimer()
  refreshTimer = window.setTimeout(() => {
    void refreshWeather()
  }, getRefreshDelayMs())
}

function formatTimeOnly(value?: string): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

function weatherCodeText(code: number | undefined, isDay: number | undefined): string {
  if (typeof code !== 'number') return '晴'
  const day = isDay === 0 ? '夜间' : ''
  if (code === 0) return day ? '晴朗夜间' : '晴'
  if (code === 1 || code === 2) return '少云'
  if (code === 3) return '多云'
  if (code === 45 || code === 48) return '雾'
  if (code === 51 || code === 53 || code === 55) return '毛毛雨'
  if (code === 56 || code === 57) return '冻毛毛雨'
  if (code === 61 || code === 63 || code === 65) return '雨'
  if (code === 66 || code === 67) return '冻雨'
  if (code === 71 || code === 73 || code === 75) return '雪'
  if (code === 77) return '雪粒'
  if (code === 80 || code === 81 || code === 82) return '阵雨'
  if (code === 85 || code === 86) return '阵雪'
  if (code === 95) return '雷暴'
  if (code === 96 || code === 99) return '雷暴冰雹'
  return '晴'
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
    const params = new URLSearchParams({
      latitude: String(props.latitude),
      longitude: String(props.longitude),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day',
      daily: 'sunrise,sunset',
      timezone: props.timezone,
      forecast_days: '1'
    })
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as OpenMeteoPayload
    weatherData.value = data
  } catch (error) {
    errorText.value = '天气数据获取失败'
    console.error('[WeatherCard] fetch failed:', error)
  } finally {
    isLoading.value = false
  }
}

async function refreshWeather(): Promise<void> {
  await fetchWeather()
  scheduleNextRefresh()
}

const currentCondition = computed(() => weatherCodeText(
  weatherData.value?.current?.weather_code,
  weatherData.value?.current?.is_day
))
const currentTemp = computed(() => `${weatherData.value?.current?.temperature_2m ?? '--'}°C`)
const sunrise = computed(() => formatTimeOnly(weatherData.value?.daily?.sunrise?.[0]))
const sunset = computed(() => formatTimeOnly(weatherData.value?.daily?.sunset?.[0]))
const humidity = computed(() => `${weatherData.value?.current?.relative_humidity_2m ?? '--'}%`)
const wind = computed(() => {
  const speed = weatherData.value?.current?.wind_speed_10m ?? '--'
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
  void refreshWeather()
})

onBeforeUnmount(() => {
  clearRefreshTimer()
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
  padding: 0.375rem 0.625rem 0.1rem 0.325rem;
  box-sizing: border-box;
  color: var(--wc-text-primary);
  opacity: 0.85;
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
