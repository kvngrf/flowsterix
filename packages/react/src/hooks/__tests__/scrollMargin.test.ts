import { describe, expect, it } from 'vitest'

import { DEFAULT_SCROLL_MARGIN, resolveScrollMargin } from '../scrollMargin'

describe('resolveScrollMargin', () => {
  it('returns the fallback when no value is provided', () => {
    const margin = resolveScrollMargin(undefined, 24)
    expect(margin).toEqual({ top: 24, bottom: 24, left: 24, right: 24 })
  })

  it('normalizes a numeric margin across all sides', () => {
    const margin = resolveScrollMargin(32)
    expect(margin).toEqual({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
    })
  })

  it('respects individual side overrides and falls back elsewhere', () => {
    const margin = resolveScrollMargin({ top: 48, left: 12 })
    expect(margin).toEqual({
      top: 48,
      bottom: DEFAULT_SCROLL_MARGIN,
      left: 12,
      right: DEFAULT_SCROLL_MARGIN,
    })
  })

  it('clamps negative values to zero', () => {
    const margin = resolveScrollMargin({ top: -10, bottom: -5 })
    expect(margin).toEqual({
      top: 0,
      bottom: 0,
      left: DEFAULT_SCROLL_MARGIN,
      right: DEFAULT_SCROLL_MARGIN,
    })
  })
})
