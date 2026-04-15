<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import MarkdownIt from "markdown-it";
import markdownItKatex from "markdown-it-katex";
import hljs from "highlight.js";
import { loadPostBySlugFromClient } from "../lib/postClientLoader";
import { updatePageSEO, resetPageSEO, extractSummary } from "../lib/seoHelper";
import "github-markdown-css/github-markdown-light.css";
import "katex/dist/katex.min.css";

const route = useRoute();
const props = withDefaults(
  defineProps<{
    slug?: string;
    embedded?: boolean;
    showHeader?: boolean;
    showTitle?: boolean;
    contentOffset?: number;
  }>(),
  {
    slug: "",
    embedded: false,
    showHeader: true,
    showTitle: true,
    contentOffset: 0,
  },
);
const contentVisible = ref(false);

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      const code: string = hljs.highlight(str, {
        language: lang,
        ignoreIllegals: true,
      }).value;
      return `<pre class="hljs"><code>${code}</code></pre>`;
    }
    const code: string = escapeHtml(str);
    return `<pre class="hljs"><code>${code}</code></pre>`;
  },
});
md.use(markdownItKatex);

const slug = computed(() => {
  const fromProps = props.slug.trim();
  if (fromProps) return fromProps;
  return String(route.params.slug ?? "");
});
const post = computed(() => loadPostBySlugFromClient(slug.value));
const renderedHtml = computed(() => {
  if (!post.value) return "";
  return md.render(post.value.body);
});

async function animateIn() {
  contentVisible.value = false;
  await nextTick();
  window.setTimeout(
    () => {
      contentVisible.value = true;
    },
    props.embedded ? 20 : 30,
  );
}

function updateSEO() {
  if (!post.value) {
    resetPageSEO();
    return;
  }

  const baseUrl = "https://nicoletteblog.vercel.app";
  const postUrl = `${baseUrl}/article/${post.value.slug}`;
  const summary = extractSummary(post.value.body, 160);
  const imageSummary = extractSummary(post.value.body, 100) || "什么都写的博客";

  updatePageSEO({
    title: `${post.value.title} - Nicolette的blog`,
    description: summary || "什么都写的博客",
    url: postUrl,
    image: `${baseUrl}/api/og?title=${encodeURIComponent(post.value.title)}&summary=${encodeURIComponent(imageSummary)}&site=${encodeURIComponent(baseUrl)}&favicon=${encodeURIComponent(`${baseUrl}/favicon.ico`)}`,
    type: "article",
  });
}

watch(slug, () => {
  animateIn();
  updateSEO();
});

onMounted(() => {
  animateIn();
  updateSEO();
});
</script>

<template>
  <main class="detail-page" :class="{ embedded: props.embedded }">
    <section
      v-if="post"
      class="detail-content-wrap"
      :class="{ embedded: props.embedded }"
      :style="{ paddingTop: `${props.contentOffset}px` }"
    >
      <h1 v-if="props.showTitle" class="detail-title">{{ post.title }}</h1>

      <article
        class="detail-article markdown-body"
        :class="{ visible: contentVisible }"
        v-html="renderedHtml"
      />

      <div class="article-end" />
    </section>

    <section v-else class="not-found">
      <h2>文章不存在</h2>
      <p>该文章可能已被移动或删除。</p>
    </section>
  </main>
</template>

<style scoped>
.detail-page {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 0.9rem 1.1rem;
  overflow: auto;
  background: transparent;
  min-width: 0;
}

.detail-page {
  scrollbar-color: #66c18c transparent;
  scrollbar-width: thin;
}

.detail-page::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.detail-page::-webkit-scrollbar-track {
  background: transparent;
}

.detail-page::-webkit-scrollbar-thumb {
  background: #66c18c;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.detail-page::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.detail-page.embedded {
  padding: 0 0.45rem 0 0;
  height: 100%;
  overflow: auto;
}

.detail-content-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: 0;
  width: min(100%, 980px);
}

.detail-content-wrap.embedded {
  width: 100%;
  max-width: none;
  align-items: stretch;
}

.detail-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
  color: #23324d;
  transform: translateY(14px);
  opacity: 0;
  animation: title-slide-in 260ms ease-out forwards;
}

.detail-article {
  width: 100%;
  background: transparent;
  opacity: 0;
  transition: opacity 100ms ease;
  min-width: 0;
}

.detail-article.visible {
  opacity: 1;
}

.article-end {
  width: 100%;
  height: 1px;
  background: rgba(35, 50, 77, 0.45);
  margin: 1rem 0 2rem;
}

.not-found {
  color: #23324d;
}

:deep(.markdown-body) {
  color: #25324a;
  background: transparent;
  font-size: 0.98rem;
  line-height: 1.7;
  max-width: 100%;
  margin: 0;
  padding: 0 !important;
  min-width: 0;
}

:deep(.markdown-body pre),
:deep(.markdown-body code) {
  font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
}

:deep(.markdown-body .hljs) {
  display: block;
  overflow-x: auto;
  padding: 0.9rem;
  background: #fdf6e3;
  color: #657b83;
}

:deep(.markdown-body .hljs-comment),
:deep(.markdown-body .hljs-quote) {
  color: #93a1a1;
  font-style: italic;
}

:deep(.markdown-body .hljs-keyword),
:deep(.markdown-body .hljs-selector-tag),
:deep(.markdown-body .hljs-literal),
:deep(.markdown-body .hljs-doctag),
:deep(.markdown-body .hljs-name),
:deep(.markdown-body .hljs-strong) {
  color: #859900;
}

:deep(.markdown-body .hljs-string),
:deep(.markdown-body .hljs-title),
:deep(.markdown-body .hljs-section),
:deep(.markdown-body .hljs-attribute),
:deep(.markdown-body .hljs-emphasis) {
  color: #2aa198;
}

:deep(.markdown-body .hljs-number),
:deep(.markdown-body .hljs-symbol),
:deep(.markdown-body .hljs-bullet),
:deep(.markdown-body .hljs-variable),
:deep(.markdown-body .hljs-template-variable),
:deep(.markdown-body .hljs-link) {
  color: #d33682;
}

:deep(.markdown-body .hljs-type),
:deep(.markdown-body .hljs-built_in),
:deep(.markdown-body .hljs-builtin-name),
:deep(.markdown-body .hljs-tag) {
  color: #b58900;
}

:deep(.markdown-body .hljs-addition) {
  color: #859900;
  background: rgba(133, 153, 0, 0.08);
}

:deep(.markdown-body .hljs-deletion) {
  color: #dc322f;
  background: rgba(220, 50, 47, 0.08);
}

:deep(.markdown-body table) {
  border-collapse: collapse;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
}

@keyframes title-slide-in {
  from {
    transform: translateY(14px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
