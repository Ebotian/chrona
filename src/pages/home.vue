<script setup>
import ProgressRail from '../components/home/ProgressRail.vue'
import Timeline from '../components/home/Timeline.vue'
import MonthPicker from '../components/home/MonthPicker.vue'
import TagRegion from '../components/home/TagRegion.vue'
import SearchBar from '../components/home/SearchBar.vue'
import ProfileCard from '../components/home/ProfileCard.vue'
import MiniPlayer from '../components/home/MiniPlayer.vue'
</script>
<template>
  <div class="home-container">
    <aside class="left">
      <ProgressRail />
    </aside>

    <main class="center">
      <section class="timeline-col">
        <Timeline />
      </section>
      <section class="tag-col">
        <MonthPicker />
        <TagRegion />
      </section>
    </main>

    <aside class="right">
      <SearchBar />
      <ProfileCard />
      <MiniPlayer />
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
  padding: 12px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
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
  flex: 4 1 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
}

.tag-col> :nth-child(1) {
  flex: 1 1 0;
  min-height: 0;
}

.tag-col> :nth-child(2) {
  flex: 15 1 0;
  min-height: 0;
  overflow: auto;
}

.right {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 15 1 0;
}

.right>* {
  flex: 1 1 0;
  min-height: 0;
  box-sizing: border-box;
  width: 100%;
}

.right> :nth-child(1) {
  flex: 1 1 0;
  min-height: 0;
}

.right> :nth-child(2) {
  flex: 8 1 0;
  min-height: 0;
}

.right> :nth-child(3) {
  flex: 7 1 0;
  min-height: 0;
}
</style>

<style>
/* 临时统一占位视觉：在页面级别覆盖所有占位组件的边框与圆角 */
.home-container .placeholder {
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 0 !important;
}
</style>
