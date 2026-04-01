<script setup lang="ts">
import { computed, ref } from 'vue'
import ProgressRail from '../components/home/ProgressRail.vue'
import Timeline from '../components/home/Timeline.vue'
import MonthPicker from '../components/home/MonthPicker.vue'
import TagRegion from '../components/home/TagRegion.vue'
import SearchBar from '../components/home/SearchBar.vue'
import ProfileCard from '../components/home/ProfileCard.vue'
import MiniPlayer from '../components/home/MiniPlayer.vue'
import WeatherCard from '../components/home/WeatherCard.vue'
import { loadPostsFromClient, toTimelineEntries } from '../lib/postClientLoader'
import { useTimeStore } from '../stores/time'

const store = useTimeStore()
const posts = loadPostsFromClient()
const timelineEntries = computed(() => toTimelineEntries(posts))
const monthJumpToken = ref(0)

function onMonthPickerChange() {
  monthJumpToken.value += 1
}

const latestDatedPost = posts.find((p) => Boolean(p.date))
if (latestDatedPost?.date) {
  store.setCurrentDate(latestDatedPost.date)
}
</script>
<template>
  <div class="home-container">
    <aside class="left">
      <ProgressRail />
    </aside>

    <main class="center">
      <section class="timeline-col">
        <Timeline :external-jump-token="monthJumpToken" />
      </section>
      <section class="tag-col">
        <MonthPicker @change="onMonthPickerChange" />
        <TagRegion :entries="timelineEntries" />
      </section>
    </main>

    <aside class="right">
      <SearchBar />
      <ProfileCard />
      <div class="etc-container">
        <WeatherCard />
        <MiniPlayer />
      </div>
    </aside>
  </div>
</template>
<style scoped>
.placeholder {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 0.0625rem solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.home-container {
  display: flex;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  align-items: stretch;
}

.left {
  display: flex;
  flex: 1 1 0;
  align-items: center;
}

.center {
  display: flex;
  height: 100%;
  flex: 30 1 0;
}


.timeline-col {
  flex: 1 1 0;
  overflow: visible;
}

.tag-col {
  flex: 15 1 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.tag-col> :nth-child(1) {
  flex: 1 1 0;
  min-height: 0;
}

.tag-col> :nth-child(2) {
  flex: 15 1 0;
  min-height: 0;
  overflow: visible;
}

.right {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 15 1 0;
  gap: 0.5rem;
}

.right>* {
  flex: 0 0 auto;
  min-height: 0;
  box-sizing: border-box;
  width: 100%;
}

.right> :nth-child(1) {
  flex: 0 0 3.375rem;
  min-height: 0;
  display: flex;
  align-items: flex-start;
}

.right> :nth-child(2) {
  flex: 1 1 0;
  min-height: 0;
}

.right> :nth-child(3) {
  flex: 1 1 0;
  min-height: 0;
}

.etc-container {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  height: 100%;
}
</style>
