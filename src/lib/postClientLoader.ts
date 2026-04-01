import type { ArticleMeta } from './postParser'

type RawModules = Record<string, string>

export type SearchablePost = ArticleMeta & {
  body: string
  searchText: string
}

export type PostDetail = ArticleMeta & {
  body: string
}

function parseFrontmatter(content: string): Record<string, string> {
  const fm: Record<string, string> = {}
  if (!content.startsWith('---')) return fm
  const end = content.indexOf('---', 3)
  if (end === -1) return fm
  const body = content.slice(3, end).trim()
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    fm[m[1]] = val
  }
  return fm
}

function filenameToSlug(file: string): string {
  const base = file.split('/').pop()?.replace(/\.[^.]+$/, '') ?? file
  const stripped = base.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, '')
  const normalized = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (normalized) return normalized
  const seed = stripped || base || file
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return `post-${hash.toString(16)}`
}

function filenameDate(file: string): string | undefined {
  const m = file.match(/(\d{4}[-.]\d{1,2}[-.]\d{1,2})/)
  return m ? m[1].replace(/\./g, '-') : undefined
}

function normalizeDate(date: string): string {
  const [y, m, d] = date.replace(/\./g, '-').split('-')
  if (!y || !m || !d) return date
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content
  const end = content.indexOf('---', 3)
  if (end === -1) return content
  return content.slice(end + 3).trim()
}

function collapseMarkdown(content: string): string {
  return stripFrontmatter(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_~>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function loadPostsFromClient(): ArticleMeta[] {
  const modules = import.meta.glob('/posts/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as RawModules

  const results: ArticleMeta[] = []
  for (const [filePath, raw] of Object.entries(modules)) {
    const fm = parseFrontmatter(raw)
    const rawName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? filePath
    const title = rawName.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, '')
    const date = fm.date || filenameDate(filePath)
    const slug = fm.slug || filenameToSlug(filePath)
    results.push({
      id: slug,
      title,
      date: date ? normalizeDate(date) : undefined,
      slug,
      filePath: filePath.slice(1)
    })
  }

  results.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })
  return results
}

export function loadSearchablePostsFromClient(): SearchablePost[] {
  const modules = import.meta.glob('/posts/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as RawModules

  const results: SearchablePost[] = []
  for (const [filePath, raw] of Object.entries(modules)) {
    const fm = parseFrontmatter(raw)
    const rawName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? filePath
    const title = rawName.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, '')
    const date = fm.date || filenameDate(filePath)
    const slug = fm.slug || filenameToSlug(filePath)
    const body = collapseMarkdown(raw)
    results.push({
      id: slug,
      title,
      date: date ? normalizeDate(date) : undefined,
      slug,
      filePath: filePath.slice(1),
      body,
      searchText: `${title} ${body}`.toLowerCase()
    })
  }

  results.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })
  return results
}

export function toTimelineEntries(posts: ArticleMeta[]): Record<string, ArticleMeta[]> {
  const entries: Record<string, ArticleMeta[]> = {}
  for (const post of posts) {
    if (!post.date) continue
    const day = post.date.slice(0, 10)
    if (!entries[day]) entries[day] = []
    if (entries[day].length < 2) entries[day].push(post)
  }
  return entries
}

export function loadPostBySlugFromClient(slug: string): PostDetail | null {
  const modules = import.meta.glob('/posts/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as RawModules

  for (const [filePath, raw] of Object.entries(modules)) {
    const fm = parseFrontmatter(raw)
    const postSlug = fm.slug || filenameToSlug(filePath)
    if (postSlug !== slug) continue
    const rawName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? filePath
    const title = rawName.replace(/^[0-9]{4}([-.][0-9]{1,2}){2}[-_]?/, '')
    const date = fm.date || filenameDate(filePath)
    return {
      id: postSlug,
      title,
      date: date ? normalizeDate(date) : undefined,
      slug: postSlug,
      filePath: filePath.slice(1),
      body: stripFrontmatter(raw)
    }
  }
  return null
}
