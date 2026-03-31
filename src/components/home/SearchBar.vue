<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { loadSearchablePostsFromClient, type SearchablePost } from '../../lib/postClientLoader'
import { useTimeStore } from '../../stores/time'

const store = useTimeStore()
const posts = loadSearchablePostsFromClient()

const query = ref('')
const activeIndex = ref(0)
const lastExecutedQuery = ref('')

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const matches = computed<SearchablePost[]>(() => {
  if (!normalizedQuery.value) return []
  return posts.filter((post) => {
    if (!post.date) return false
    return post.searchText.includes(normalizedQuery.value)
  })
})

const totalMatches = computed(() => matches.value.length)

const displayIndex = computed(() => {
  if (totalMatches.value === 0) return 0
  return Math.min(activeIndex.value, totalMatches.value - 1) + 1
})

function jumpToMatch(index: number) {
  if (totalMatches.value === 0) return
  const next = ((index % totalMatches.value) + totalMatches.value) % totalMatches.value
  activeIndex.value = next
  const match = matches.value[next]
  if (!match?.date) return
  store.setCurrentDate(match.date)
}

function runSearch() {
  lastExecutedQuery.value = normalizedQuery.value
  if (totalMatches.value === 0) {
    activeIndex.value = 0
    return
  }
  jumpToMatch(0)
}

function goToNextMatch() {
  if (normalizedQuery.value !== lastExecutedQuery.value) {
    runSearch()
    return
  }
  if (totalMatches.value === 0) return
  jumpToMatch(activeIndex.value + 1)
}

function onSubmit() {
  runSearch()
}

watch(normalizedQuery, () => {
  activeIndex.value = 0
})
</script>

<template>
  <div class="search-shell">
    <form class="search-frame" role="search" @submit.prevent="onSubmit">
      <button
        type="submit"
        class="icon-button"
        :class="{ 'is-disabled': !normalizedQuery }"
        aria-label="Search articles"
      >
        <span class="magnifier" aria-hidden="true" />
      </button>

      <span class="divider" aria-hidden="true" />

      <input
        v-model="query"
        class="search-input"
        type="search"
        inputmode="search"
        spellcheck="false"
        autocomplete="off"
        placeholder=""
        aria-label="Search title or full text"
      />

      <span class="divider" aria-hidden="true" />

      <button
        type="button"
        class="next-button"
        :disabled="totalMatches === 0"
        :aria-label="totalMatches === 0 ? 'No matches' : 'Jump to next match'"
        @click="goToNextMatch"
      >
        <span class="counter">{{ displayIndex }}/{{ totalMatches }}</span>
        <span class="triangle" aria-hidden="true" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.search-shell {
  --picker-height: 2.625rem;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
  padding: 0.375rem 0.625rem 0.375rem 0;
  box-sizing: border-box;
}

.search-frame {
  width: clamp(22rem, 68%, 34rem);
  height: var(--picker-height);
  display: grid;
  grid-template-columns: 2.5rem 1px minmax(0, 1fr) 1px 4.9rem;
  align-items: stretch;
  border: 0.0625rem solid #1772b4;
  border-radius: 0.375rem;
  background: transparent;
  overflow: hidden;
  box-sizing: border-box;
}

.icon-button,
.next-button {
  border: none;
  background: transparent;
  color: #1a2a4b;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font: inherit;
}

.icon-button {
  display: grid;
  place-items: center;
}

.icon-button.is-disabled {
  cursor: default;
  opacity: 0.55;
}

.magnifier {
  width: 0.8rem;
  height: 0.8rem;
  border: 0.1rem solid #1772b4;
  border-radius: 50%;
  position: relative;
  box-sizing: border-box;
}

.magnifier::after {
  content: '';
  position: absolute;
  width: 0.42rem;
  height: 0.1rem;
  background: #1772b4;
  right: -0.3rem;
  bottom: -0.14rem;
  transform: rotate(45deg);
  border-radius: 999px;
}

.divider {
  width: 1px;
  align-self: stretch;
  height: 100%;
  background: #1772b4;
}

.search-input {
  border: none;
  background: transparent;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0 0.75rem;
  color: #0f2143;
  font: inherit;
  font-size: 0.8125rem;
  line-height: 1.1;
  outline: none;
  caret-color: #1772b4;
  -webkit-text-fill-color: #0f2143;
}

.search-input::placeholder {
  color: transparent;
}

.next-button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  justify-content: stretch;
  gap: 0.35rem;
  padding: 0 0.55rem;
  min-width: 0;
}

.next-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.counter {
  min-width: 0;
  font-size: 0.74rem;
  color: #24456c;
  white-space: nowrap;
  text-align: right;
  overflow: hidden;
}

.triangle {
  width: 0;
  height: 0;
  border-left: 0.38rem solid transparent;
  border-right: 0.38rem solid transparent;
  border-top: 0.56rem solid #1772b4;
  flex: 0 0 auto;
}
</style>
