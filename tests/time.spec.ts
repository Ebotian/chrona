import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimeStore } from '../src/stores/time'

describe('time store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with YYYY-MM-DD currentDate', () => {
    const s = useTimeStore()
    expect(s.currentDate).toBeTypeOf('string')
    expect(s.currentDate.length).toBe(10)
    expect(/\d{4}-\d{2}-\d{2}/.test(s.currentDate)).toBe(true)
  })

  it('stepDay advances the date by delta days', () => {
    const s = useTimeStore()
    const original = s.currentDate
    s.stepDay(1)
    expect(s.currentDate).not.toBe(original)
  })

  it('alignToMonth sets date to month start', () => {
    const s = useTimeStore()
    s.alignToMonth(1, 2000)
    expect(s.currentDate).toBe('2000-01-01')
  })

  it('yearProgress is between 0 and 1', () => {
    const s = useTimeStore()
    s.setCurrentDate('2024-06-15')
    expect(s.yearProgress).toBeGreaterThanOrEqual(0)
    expect(s.yearProgress).toBeLessThanOrEqual(1)
  })

  it('setViewport records viewport bounds', () => {
    const s = useTimeStore()
    s.setViewport('2024-01-01', '2024-02-01')
    expect(s.viewportStart).toBe('2024-01-01')
    expect(s.viewportEnd).toBe('2024-02-01')
  })
})
