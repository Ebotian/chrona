import { describe, it, expect } from 'vitest'
import loadPosts from '../src/lib/postParser'
import path from 'path'

describe('postParser', () => {
  const fixtures = path.join(process.cwd(), 'tests', 'fixtures', 'posts')

  it('loads posts and extracts metadata', async () => {
    const posts = await loadPosts(fixtures)
    // ensure we found our three fixtures
    const ids = posts.map(p => p.id)
    expect(ids).toContain('custom-a')
    expect(ids).toContain('b')
    expect(ids).toContain('cool-post')
  })

  it('parses title and date from frontmatter or heading', async () => {
    const posts = await loadPosts(fixtures)
    const a = posts.find(p => p.id === 'custom-a')!
    expect(a.title).toBe('a')
    expect(a.date).toBe('2023-05-01')

    const b = posts.find(p => p.id === 'b')!
    expect(b.title).toBe('b')

    const c = posts.find(p => p.id === 'cool-post')!
    expect(c.date).toBe('2022-12-31')
  })
})
