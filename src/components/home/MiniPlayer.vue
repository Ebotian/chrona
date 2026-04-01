<template>
  <div ref="shellRef" class="mini-player-shell" :style="shellStyle">
    <div class="mini-player">
      <div class="control-bar" role="toolbar">
        <button class="btn area" @click="prev" :disabled="!hasPlaylist" aria-label="prev">
          <span class="icon">&lt;</span>
        </button>
        <div class="sep" />

        <button class="btn area play-btn" @click="togglePlay" :disabled="!hasPlaylist" aria-label="play-pause">
          <span class="icon" :class="{ fade: iconFading }">{{ isPlaying ? '▮▮' : '▶' }}</span>
        </button>
        <div class="sep" />

        <button class="btn area" @click="next" :disabled="!hasPlaylist" aria-label="next">
          <span class="icon">&gt;</span>
        </button>
      </div>

      <div class="cover-area">
        <div class="covers">
          <!-- current shown image -->
          <img v-if="currentSrc" :key="'current-' + idx" :src="currentSrc" class="cover current" :class="currentClass"
            alt="album cover" />

          <!-- incoming image during transition -->
          <img v-if="incomingSrc" :key="'incoming-' + incomingToken" :src="incomingSrc" class="cover incoming"
            :class="incomingClass" alt="incoming cover" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import playlistJson from '../../assets/playlist.json'

const props = defineProps({ playlist: { type: Array, default: () => [] }, startIndex: { type: Number, default: 0 } })

const playlist = computed(() => (props.playlist && props.playlist.length) ? props.playlist : playlistJson || [])

const idx = ref(Math.max(0, Math.min(props.startIndex, Math.max(0, playlist.value.length - 1))))
const isPlaying = ref(false)
const iconFading = ref(false)

const currentClass = ref('')
const incomingClass = ref('')
const incomingSrc = ref('')
const incomingToken = ref(0)

const hasPlaylist = computed(() => playlist.value && playlist.value.length > 0)
const currentSrc = computed(() => hasPlaylist.value ? playlist.value[idx.value]?.cover || '' : '')

let audio = null
const FADE_MS = 300
const shellRef = ref(null)
const syncedHeight = ref(0)
let heightObserver = null

function ensureAudio() {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('ended', () => next())
  }
}

function fadeVolume(to, ms) {
  if (!audio) return
  const from = audio.volume
  const frames = 20
  const step = (to - from) / frames
  const dt = Math.max(10, Math.round(ms / frames))
  let i = 0
  const t = setInterval(() => {
    i++
    audio.volume = Math.min(1, Math.max(0, audio.volume + step))
    if (i >= frames) clearInterval(t)
  }, dt)
}

function setSourceAndPlay(src) {
  ensureAudio()
  if (!src) return
  audio.src = src
  audio.currentTime = 0
  audio.volume = 0
  audio.play().then(() => {
    fadeVolume(1, FADE_MS)
    isPlaying.value = true
    iconFading.value = true
    setTimeout(() => (iconFading.value = false), 200)
  }).catch(() => {
    isPlaying.value = false
  })
}

function togglePlay() {
  if (!hasPlaylist.value) return
  ensureAudio()
  if (isPlaying.value) {
    fadeVolume(0, FADE_MS)
    iconFading.value = true
    setTimeout(() => {
      audio.pause()
      isPlaying.value = false
      iconFading.value = false
    }, FADE_MS + 30)
  } else {
    setSourceAndPlay(playlist.value[idx.value]?.src)
  }
}

function next() { slideTo((idx.value + 1) % playlist.value.length, 'next') }
function prev() { slideTo((idx.value - 1 + playlist.value.length) % playlist.value.length, 'prev') }

function slideTo(newIndex, mode) {
  if (!hasPlaylist.value || newIndex === idx.value) return

  // prepare incoming
  incomingSrc.value = playlist.value[newIndex]?.cover || ''
  // bump token so incoming image gets a fresh key (avoid DOM reuse)
  incomingToken.value++
  // clear classes, set start position
  currentClass.value = ''
  incomingClass.value = mode === 'next' ? 'from-left' : 'from-right'

  // force paint and then apply enter/exit classes
  requestAnimationFrame(() => requestAnimationFrame(() => {
    currentClass.value = mode === 'next' ? 'exit-right' : 'exit-left'
    incomingClass.value = (mode === 'next' ? 'from-left' : 'from-right') + ' enter'
  }))

  // after animation ends, swap
  setTimeout(() => {
    // clear animation classes before the swap so new current doesn't inherit exit
    currentClass.value = ''
    incomingClass.value = ''
    idx.value = newIndex
    incomingSrc.value = ''
    // if playing, switch audio source with quick crossfade
    if (isPlaying.value) {
      fadeVolume(0, FADE_MS / 2)
      setTimeout(() => setSourceAndPlay(playlist.value[newIndex]?.src), FADE_MS / 2 + 10)
    }
  }, 340)
}

onMounted(() => {
  // do not autoplay; audio will be created lazily on first play
  const shell = shellRef.value
  const container = shell?.parentElement
  const weatherCard = container?.querySelector('.weather-card')

  if (!weatherCard) return

  const applyHeight = () => {
    const h = weatherCard.getBoundingClientRect().height
    if (h > 0) syncedHeight.value = Math.round(h)
  }

  applyHeight()
  heightObserver = new ResizeObserver(applyHeight)
  heightObserver.observe(weatherCard)
})

onBeforeUnmount(() => {
  if (heightObserver) {
    heightObserver.disconnect()
    heightObserver = null
  }
})

const shellStyle = computed(() => {
  if (syncedHeight.value <= 0) return {}
  return { height: `${syncedHeight.value}px` }
})
</script>

<style scoped>
.mini-player-shell {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 0.375rem 0.625rem 0.375rem 0;
  box-sizing: border-box;
  overflow: hidden;
}

.mini-player {
  width: min(100%, 34rem);
  max-width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 2px solid #aed9d4;
  overflow: hidden;
  background: transparent;
}

.control-bar {
  display: flex;
  align-items: stretch;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  height: 56px;
}

.btn.area {
  flex: 1 1 0;
  border: none;
  background: #c6e6e8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.btn.area:not(:disabled):hover {
  opacity: 0.7;
}

.btn.area:disabled {
  opacity: 0.5;
  cursor: default
}

.sep {
  width: 2px;
  background: #aed9d4;
  height: 100%;
}

.icon {
  font-size: 18px;
  transition: opacity 200ms ease
}

.icon.fade {
  opacity: 0.5
}

.play-btn .icon {
  font-size: 20px
}

.cover-area {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
  overflow: hidden;
}

.covers {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover !important;
  object-position: center;
}

/* transitions */
.cover {
  transition: transform 300ms ease, opacity 300ms ease
}

.incoming {
  opacity: 0
}

.incoming.enter {
  opacity: 1
}

/* incoming start positions */
.incoming.from-left {
  transform: translateX(-100%)
}

.incoming.from-right {
  transform: translateX(100%)
}

.incoming.enter {
  transform: translateX(0%)
}

/* current exit */
.current.exit-right {
  transform: translateX(100%)
}

.current.exit-left {
  transform: translateX(-100%)
}
</style>
