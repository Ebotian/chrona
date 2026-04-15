<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProgressRail from "../components/home/ProgressRail.vue";
import Timeline from "../components/home/Timeline.vue";
import MonthPicker from "../components/home/MonthPicker.vue";
import TagRegion from "../components/home/TagRegion.vue";
import SearchBar from "../components/home/SearchBar.vue";
import ProfileCard from "../components/home/ProfileCard.vue";
import MiniPlayer from "../components/home/MiniPlayer.vue";
import WeatherCard from "../components/home/WeatherCard.vue";
import DetailPage from "./detail.vue";
import {
  loadPostsFromClient,
  toTimelineEntries,
} from "../lib/postClientLoader";
import { useTimeStore } from "../stores/time";

const store = useTimeStore();
const router = useRouter();
const route = useRoute();
const posts = loadPostsFromClient();
const timelineEntries = computed(() => toTimelineEntries(posts));
const monthJumpToken = ref(0);
const sharedStageRef = ref<HTMLElement | null>(null);
const frozenHostRef = ref<HTMLElement | null>(null);
const monthPickerSlotRef = ref<HTMLElement | null>(null);
const isNavigating = ref(false);
const isClosingDetail = ref(false);
const monthPickerHidden = ref(false);
const monthPickerCollapsed = ref(false);
const frozenRowLeft = ref(0);
const frozenRowHeight = ref(0);
const frozenRowTopLocal = ref(0);
const frozenRowOriginalHeight = ref(0);
const frozenRowStartTopGlobal = ref(0);
const monthPickerCenterYGlobal = ref(0);
const DETAIL_GAP = 10;
const EXIT_BTN_HEIGHT = 32;
const DETAIL_FADE_OUT_MS = 100;
const MONTH_FADE_MS = 10;
const MONTH_COLLAPSE_MS = 180;
let frozenGhostEl: HTMLElement | null = null;
type TagClickPayload = {
  articleId: string;
  title: string;
  rect: { left: number; top: number; width: number; height: number };
  rowRect: { left: number; top: number; width: number; height: number };
  rowHtml: string;
  rowElement: HTMLElement | null;
};

const activeSlug = computed(() => {
  const raw = route.params.slug;
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value ? value : null;
});

const activePost = computed(() => {
  if (!activeSlug.value) return null;
  return posts.find((post) => post.slug === activeSlug.value) ?? null;
});

const isDetailOpen = computed(
  () => route.name === "article-detail" && Boolean(activeSlug.value),
);

function onMonthPickerChange() {
  monthJumpToken.value += 1;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

async function animateRowToTop(payload: TagClickPayload): Promise<void> {
  const stage = sharedStageRef.value;
  if (!stage || !payload.rowHtml) return;

  const host = document.createElement("div");
  host.innerHTML = payload.rowHtml;
  const ghost = host.firstElementChild as HTMLElement | null;
  if (!ghost) return;

  const stageRect = stage.getBoundingClientRect();
  const startTop = payload.rowRect.top;
  frozenRowLeft.value = Math.max(0, payload.rowRect.left - stageRect.left);
  frozenRowOriginalHeight.value = Math.max(1, payload.rowRect.height);
  frozenRowHeight.value = frozenRowOriginalHeight.value;
  const targetCenterY = monthPickerCenterYGlobal.value || stageRect.top;
  const targetTop = targetCenterY - frozenRowOriginalHeight.value / 2;
  const localTargetTop = targetTop - stageRect.top;
  frozenRowTopLocal.value = localTargetTop;
  frozenRowStartTopGlobal.value = payload.rowRect.top;

  ghost.style.position = "fixed";
  ghost.style.left = `${payload.rowRect.left}px`;
  ghost.style.top = `${startTop}px`;
  ghost.style.zIndex = "9998";
  ghost.style.pointerEvents = "none";

  document.body.appendChild(ghost);
  if (payload.rowElement) payload.rowElement.style.visibility = "hidden";
  try {
    await ghost.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(${targetTop - startTop}px)` },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    ).finished;
    ghost.style.position = "absolute";
    ghost.style.left = `${frozenRowLeft.value}px`;
    ghost.style.top = `${localTargetTop}px`;
    ghost.style.zIndex = "6";
    ghost.style.pointerEvents = "none";
    const host = frozenHostRef.value;
    if (host) {
      if (frozenGhostEl && frozenGhostEl.parentNode) frozenGhostEl.remove();
      host.appendChild(ghost);
      frozenGhostEl = ghost;
      return;
    }
  } finally {
    if (!ghost.parentNode) ghost.remove();
  }
}

async function onTagClick(payload: TagClickPayload) {
  if (isNavigating.value) return;
  const slug = payload.articleId?.trim();
  if (!slug) return;
  isNavigating.value = true;
  isClosingDetail.value = false;
  let navigated = false;
  const monthRect = monthPickerSlotRef.value?.getBoundingClientRect();
  if (monthRect)
    monthPickerCenterYGlobal.value = monthRect.top + monthRect.height / 2;
  const hiddenRows: HTMLElement[] = [];
  const clickedRow = payload.rowElement;
  const rowContainer = clickedRow?.parentElement;
  if (rowContainer && clickedRow) {
    const allRows = Array.from(
      rowContainer.querySelectorAll(".row-band"),
    ) as HTMLElement[];
    for (const row of allRows) {
      if (row === clickedRow) continue;
      row.style.visibility = "hidden";
      hiddenRows.push(row);
    }
  }
  try {
    monthPickerHidden.value = true;
    await wait(MONTH_FADE_MS);
    monthPickerCollapsed.value = true;
    await wait(MONTH_COLLAPSE_MS);
    await animateRowToTop(payload);
    await router.push({ name: "article-detail", params: { slug } });
    navigated = true;
  } finally {
    if (!navigated) {
      monthPickerCollapsed.value = false;
      monthPickerHidden.value = false;
      monthPickerCenterYGlobal.value = 0;
      if (clickedRow) clickedRow.style.visibility = "";
      for (const row of hiddenRows) row.style.visibility = "";
    }
    isNavigating.value = false;
  }
}

async function onShareClick() {
  const slug = activeSlug.value;
  if (!slug) return;

  const articleUrl = `${window.location.origin}/article/${slug}`;
  const title = activePost.value?.title
    ? `${activePost.value.title} - Nicolette的blog`
    : "Nicolette的blog";

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text: activePost.value?.title ?? "",
        url: articleUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(articleUrl);
  } catch {
    try {
      await navigator.clipboard.writeText(articleUrl);
    } catch {
      window.prompt("复制文章链接", articleUrl);
    }
  }
}

async function animateRowBackToOrigin(): Promise<void> {
  const stage = sharedStageRef.value;
  const ghost = frozenGhostEl;
  if (!stage || !ghost) return;

  const stageRect = stage.getBoundingClientRect();
  const rowRect = ghost.getBoundingClientRect();
  const rowHeight = Math.max(1, frozenRowHeight.value || rowRect.height);
  const startTop = rowRect.top;
  const targetTop =
    frozenRowStartTopGlobal.value ||
    stageRect.top + stageRect.height / 2 - rowHeight / 2;
  const localTargetTop = targetTop - stageRect.top;

  ghost.style.position = "fixed";
  ghost.style.left = `${rowRect.left}px`;
  ghost.style.top = `${startTop}px`;
  ghost.style.zIndex = "9998";
  ghost.style.pointerEvents = "none";
  document.body.appendChild(ghost);

  try {
    await ghost.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(${targetTop - startTop}px)` },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    ).finished;

    // Keep ghost attached over the shared stage for the first paint after route switch,
    // so the real row-band can appear underneath without a same-position flash.
    const host = frozenHostRef.value;
    if (host) {
      ghost.style.position = "absolute";
      ghost.style.left = `${frozenRowLeft.value}px`;
      ghost.style.top = `${localTargetTop}px`;
      ghost.style.transform = "none";
      ghost.style.zIndex = "6";
      ghost.style.pointerEvents = "none";
      host.appendChild(ghost);
    }
  } catch {
    // Ignore animation interruptions and continue fallback cleanup.
  }
}

async function onDetailClose() {
  if (isNavigating.value) return;
  isNavigating.value = true;
  isClosingDetail.value = true;

  try {
    // Reverse sequence: first hide detail UI, then move the frozen row back to center.
    await wait(DETAIL_FADE_OUT_MS);
    await animateRowBackToOrigin();
    await router.push({ name: "home" });
    await nextTick();
    await nextFrame();
    await nextFrame();

    // Remove ghost before MonthPicker expands, otherwise layout growth drags ghost downward.
    if (frozenGhostEl) {
      frozenGhostEl.remove();
      frozenGhostEl = null;
    }

    monthPickerCollapsed.value = false;
    await wait(MONTH_COLLAPSE_MS);
    monthPickerHidden.value = false;
    await wait(MONTH_FADE_MS);
  } finally {
    if (frozenGhostEl) {
      frozenGhostEl.remove();
      frozenGhostEl = null;
    }
    frozenRowLeft.value = 0;
    frozenRowHeight.value = 0;
    frozenRowTopLocal.value = 0;
    frozenRowOriginalHeight.value = 0;
    frozenRowStartTopGlobal.value = 0;
    monthPickerCenterYGlobal.value = 0;
    isClosingDetail.value = false;
    isNavigating.value = false;
  }
}

const latestDatedPost = posts.find((p) => Boolean(p.date));
if (latestDatedPost?.date) {
  store.setCurrentDate(latestDatedPost.date);
}
</script>
<template>
  <div class="home-container">
    <aside class="left">
      <ProgressRail />
    </aside>

    <main class="center">
      <section class="timeline-col" :class="{ locked: isDetailOpen }">
        <Timeline
          :key="`timeline-${isDetailOpen ? 'detail' : 'list'}`"
          :external-jump-token="monthJumpToken"
        />
      </section>
      <section class="tag-col">
        <div
          ref="monthPickerSlotRef"
          class="month-picker-slot"
          :class="{
            hidden: monthPickerHidden,
            collapsed: monthPickerCollapsed,
            locked: isDetailOpen,
          }"
        >
          <MonthPicker @change="onMonthPickerChange" />
        </div>
        <section ref="sharedStageRef" class="shared-stage">
          <div ref="frozenHostRef" class="frozen-host" />
          <Transition name="shared-swap" mode="out-in">
            <TagRegion
              v-if="!isDetailOpen"
              key="tag-region"
              :entries="timelineEntries"
              @tag-click="onTagClick"
            />
            <div
              v-else
              :key="`detail-${activeSlug}`"
              class="detail-stage"
              :class="{ closing: isClosingDetail }"
            >
              <div
                class="detail-actions"
                :style="{
                  top: `${frozenRowTopLocal + frozenRowHeight + DETAIL_GAP}px`,
                }"
              >
                <button
                  class="detail-action-btn share-btn"
                  type="button"
                  @click="onShareClick"
                >
                  分享
                </button>
                <button
                  class="detail-action-btn back-btn"
                  type="button"
                  @click="onDetailClose"
                >
                  返回
                </button>
              </div>
              <div
                class="detail-content-host"
                :style="{
                  top: `${frozenRowTopLocal + frozenRowHeight + DETAIL_GAP + EXIT_BTN_HEIGHT + DETAIL_GAP}px`,
                }"
              >
                <DetailPage
                  :slug="activeSlug || ''"
                  embedded
                  :show-header="false"
                  :show-title="false"
                  :content-offset="0"
                />
              </div>
            </div>
          </Transition>
        </section>
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
  min-width: 0;
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
  min-width: 0;
}

.tag-col > :nth-child(1) {
  flex: 0 0 3.375rem;
  min-height: 0;
  position: relative;
  z-index: 4;
}

.month-picker-slot {
  opacity: 1;
  transition:
    opacity 10ms linear,
    flex-basis 180ms ease,
    max-height 180ms ease;
  max-height: 3.375rem;
  overflow: hidden;
}

.month-picker-slot.hidden {
  opacity: 0;
  pointer-events: none;
}

.month-picker-slot.collapsed {
  flex-basis: 0 !important;
  max-height: 0;
}

.tag-col > :nth-child(2) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.shared-stage {
  position: relative;
  flex: 15 1 0;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  isolation: isolate;
}

.shared-stage > * {
  height: 100%;
}

.detail-stage {
  position: relative;
  height: 100%;
  min-height: 0;
}

.frozen-host {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}

.frozen-host :deep(.row-band) {
  opacity: 1 !important;
}

.frozen-host :deep(.row-line),
.frozen-host :deep(.row-content),
.frozen-host :deep(.article-cell) {
  pointer-events: none !important;
}

.frozen-host :deep(.row-band),
.frozen-host :deep(.row-content) {
  transform: none !important;
}

.detail-actions {
  position: absolute;
  right: 0.2rem;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.detail-action-btn {
  border: 1px solid #2376b7;
  color: #2376b7;
  background: transparent;
  border-radius: 10px;
  height: 32px;
  padding: 0 0.65rem;
  font-size: 0.82rem;
  line-height: 32px;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}

.detail-action-btn:hover {
  background: rgba(35, 118, 183, 0.14);
}

.detail-content-host {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 0;
  overflow: hidden;
}

.detail-actions,
.detail-content-host {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 100ms ease,
    transform 100ms ease;
}

.detail-stage.closing .detail-actions,
.detail-stage.closing .detail-content-host {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}

.shared-swap-enter-active,
.shared-swap-leave-active {
  transition: none;
}

.shared-swap-enter-from {
  opacity: 1;
  transform: none;
}

.shared-swap-leave-to {
  opacity: 1;
  transform: none;
}

.locked {
  pointer-events: none;
}

.right {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 15 1 0;
  gap: 0.5rem;
}

.right > * {
  flex: 0 0 auto;
  min-height: 0;
  box-sizing: border-box;
  width: 100%;
}

.right > :nth-child(1) {
  flex: 0 0 3.375rem;
  min-height: 0;
  display: flex;
  align-items: flex-start;
}

.right > :nth-child(2) {
  flex: 1 1 0;
  min-height: 0;
}

.right > :nth-child(3) {
  flex: 1 1 0;
  min-height: 0;
}

.etc-container {
  display: flex;
  flex-direction: row;
  gap: 0;
  height: 100%;
  align-items: flex-start;
}
</style>
