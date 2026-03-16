import { describe, expect, it } from 'vitest'

import type { ClientRectLike } from '../../utils/dom'
import {
  hasStableVisibilityForStepTransition,
  isRectInViewport,
  isScrollendSupported,
  rectIntersectsViewport,
  rectMoved,
  rectPositionDistance,
  SETTLE_FRAME_COUNT,
  SETTLE_RECT_THRESHOLD,
  visibleSpan,
} from '../settleUtils'

const rect = (
  top: number,
  left: number,
  width: number,
  height: number,
): ClientRectLike => ({
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

const viewport = rect(0, 0, 1024, 768)

describe('settleUtils constants', () => {
  it('has expected settle frame count', () => {
    expect(SETTLE_FRAME_COUNT).toBe(6)
  })

  it('has expected settle rect threshold', () => {
    expect(SETTLE_RECT_THRESHOLD).toBe(0.5)
  })
})

describe('rectIntersectsViewport', () => {
  it('returns true for rect fully inside viewport', () => {
    expect(rectIntersectsViewport(rect(100, 100, 200, 200), viewport)).toBe(true)
  })

  it('returns true for partially visible rect', () => {
    expect(rectIntersectsViewport(rect(-50, 100, 200, 200), viewport)).toBe(true)
  })

  it('returns false for rect fully above viewport', () => {
    expect(rectIntersectsViewport(rect(-300, 100, 200, 200), viewport)).toBe(false)
  })

  it('returns false for rect fully below viewport', () => {
    expect(rectIntersectsViewport(rect(800, 100, 200, 200), viewport)).toBe(false)
  })

  it('returns false for rect fully to the right', () => {
    expect(rectIntersectsViewport(rect(100, 1100, 200, 200), viewport)).toBe(false)
  })
})

describe('visibleSpan', () => {
  it('returns full width when fully inside boundary', () => {
    expect(visibleSpan(100, 300, 1024)).toBe(200)
  })

  it('clips to boundary', () => {
    expect(visibleSpan(-50, 100, 1024)).toBe(100)
  })

  it('returns 0 when fully outside', () => {
    expect(visibleSpan(-200, -100, 1024)).toBe(0)
  })
})

describe('hasStableVisibilityForStepTransition', () => {
  it('returns true for fully visible rect', () => {
    expect(
      hasStableVisibilityForStepTransition(rect(100, 100, 200, 200), viewport),
    ).toBe(true)
  })

  it('returns false for zero-size rect', () => {
    expect(
      hasStableVisibilityForStepTransition(rect(100, 100, 0, 200), viewport),
    ).toBe(false)
  })

  it('returns false when less than 90% is visible', () => {
    // Only ~5% visible (top 10 of 200 height)
    expect(
      hasStableVisibilityForStepTransition(rect(-190, 100, 200, 200), viewport),
    ).toBe(false)
  })

  it('handles oversized rects checking viewport coverage', () => {
    // Rect taller than viewport, covering 90%+
    expect(
      hasStableVisibilityForStepTransition(rect(-100, 0, 1024, 2000), viewport),
    ).toBe(true)
  })
})

describe('rectMoved', () => {
  it('returns false for identical rects', () => {
    const r = rect(100, 100, 200, 200)
    expect(rectMoved(r, r)).toBe(false)
  })

  it('returns false for sub-threshold movement', () => {
    expect(rectMoved(rect(100, 100, 200, 200), rect(100.3, 100, 200, 200))).toBe(false)
  })

  it('returns true for above-threshold movement', () => {
    expect(rectMoved(rect(100, 100, 200, 200), rect(101, 100, 200, 200))).toBe(true)
  })

  it('respects custom threshold', () => {
    expect(rectMoved(rect(100, 100, 200, 200), rect(100.3, 100, 200, 200), 0.2)).toBe(true)
  })
})

describe('rectPositionDistance', () => {
  it('returns 0 for same position', () => {
    const r = rect(100, 100, 200, 200)
    expect(rectPositionDistance(r, r)).toBe(0)
  })

  it('returns correct euclidean distance', () => {
    expect(rectPositionDistance(rect(0, 0, 10, 10), rect(3, 4, 10, 10))).toBe(5)
  })
})

describe('isRectInViewport', () => {
  const margin = { top: 16, bottom: 16, left: 16, right: 16 }

  it('returns true when rect is within viewport margins', () => {
    expect(isRectInViewport(rect(100, 100, 200, 200), viewport, margin)).toBe(true)
  })

  it('returns false when rect top is above margin', () => {
    expect(isRectInViewport(rect(10, 100, 200, 200), viewport, margin)).toBe(false)
  })

  it('returns false when rect bottom exceeds viewport minus margin', () => {
    expect(isRectInViewport(rect(600, 100, 200, 200), viewport, margin)).toBe(false)
  })

  it('handles oversized rects (must cover viewport)', () => {
    // Oversized: must extend beyond margin on both sides
    expect(
      isRectInViewport(rect(-100, 0, 1024, 2000), viewport, margin),
    ).toBe(true)
  })
})

describe('isScrollendSupported', () => {
  it('returns a boolean', () => {
    expect(typeof isScrollendSupported()).toBe('boolean')
  })
})
