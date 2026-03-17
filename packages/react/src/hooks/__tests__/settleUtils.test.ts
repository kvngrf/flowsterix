import { describe, expect, it, vi } from 'vitest'

import type { ClientRectLike } from '../../utils/dom'
import {
  getElementVisibleRatio,
  hasStableVisibilityForStepTransition,
  isRectInViewport,
  isScrollendSupported,
  MAX_VISIBILITY_WAIT_MS,
  rectIntersectsViewport,
  rectMoved,
  rectPositionDistance,
  SETTLE_FRAME_COUNT,
  SETTLE_RECT_THRESHOLD,
  SETTLE_VISIBILITY_THRESHOLD,
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

describe('visibility-aware settlement constants', () => {
  it('has expected visibility threshold', () => {
    expect(SETTLE_VISIBILITY_THRESHOLD).toBe(0.85)
  })

  it('has expected max visibility wait', () => {
    expect(MAX_VISIBILITY_WAIT_MS).toBe(3000)
  })
})

describe('getElementVisibleRatio', () => {
  const createMockElement = (
    elementRect: { top: number; left: number; width: number; height: number },
    ancestors: Array<{
      rect: { top: number; left: number; width: number; height: number }
      overflowX?: string
      overflowY?: string
    }> = [],
  ): Element => {
    // Build ancestor chain: innermost parent first
    const parentElements: Array<Partial<Element>> = []

    for (let i = 0; i < ancestors.length; i++) {
      const ancestor = ancestors[i]
      const el: Partial<Element> = {
        getBoundingClientRect: () => ({
          top: ancestor.rect.top,
          left: ancestor.rect.left,
          width: ancestor.rect.width,
          height: ancestor.rect.height,
          right: ancestor.rect.left + ancestor.rect.width,
          bottom: ancestor.rect.top + ancestor.rect.height,
          x: ancestor.rect.left,
          y: ancestor.rect.top,
          toJSON: () => ({}),
        }),
        parentElement: (i < ancestors.length - 1 ? parentElements[i + 1] : null) as HTMLElement | null,
      }
      parentElements.push(el)
    }

    const element: Partial<Element> = {
      getBoundingClientRect: () => ({
        top: elementRect.top,
        left: elementRect.left,
        width: elementRect.width,
        height: elementRect.height,
        right: elementRect.left + elementRect.width,
        bottom: elementRect.top + elementRect.height,
        x: elementRect.left,
        y: elementRect.top,
        toJSON: () => ({}),
      }),
      parentElement: (parentElements.length > 0 ? parentElements[0] : null) as HTMLElement | null,
    }

    // Mock getComputedStyle for each ancestor
    const originalGetComputedStyle = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      for (let i = 0; i < parentElements.length; i++) {
        if (el === parentElements[i]) {
          return {
            overflowX: ancestors[i].overflowX ?? 'visible',
            overflowY: ancestors[i].overflowY ?? 'visible',
          } as CSSStyleDeclaration
        }
      }
      return originalGetComputedStyle(el)
    })

    return element as Element
  }

  it('returns 1 for element with no clipping ancestors', () => {
    const el = createMockElement(
      { top: 100, left: 100, width: 200, height: 100 },
    )
    expect(getElementVisibleRatio(el)).toBe(1)
    vi.restoreAllMocks()
  })

  it('returns 1 when ancestors have overflow: visible', () => {
    const el = createMockElement(
      { top: 100, left: 100, width: 200, height: 100 },
      [{ rect: { top: 0, left: 0, width: 1024, height: 768 }, overflowX: 'visible', overflowY: 'visible' }],
    )
    expect(getElementVisibleRatio(el)).toBe(1)
    vi.restoreAllMocks()
  })

  it('returns ~0.5 when element is half-clipped by parent overflow:hidden', () => {
    // Parent is 100px wide with overflow:hidden, element is 200px wide at same left
    const el = createMockElement(
      { top: 100, left: 0, width: 200, height: 100 },
      [{ rect: { top: 0, left: 0, width: 100, height: 768 }, overflowX: 'hidden', overflowY: 'visible' }],
    )
    const ratio = getElementVisibleRatio(el)
    expect(ratio).toBeCloseTo(0.5)
    vi.restoreAllMocks()
  })

  it('returns 0 when element is fully clipped', () => {
    // Parent has 0 width with overflow:hidden
    const el = createMockElement(
      { top: 100, left: 0, width: 200, height: 100 },
      [{ rect: { top: 0, left: 0, width: 0, height: 768 }, overflowX: 'hidden', overflowY: 'visible' }],
    )
    expect(getElementVisibleRatio(el)).toBe(0)
    vi.restoreAllMocks()
  })

  it('returns 0 for zero-size element', () => {
    const el = createMockElement({ top: 100, left: 100, width: 0, height: 100 })
    expect(getElementVisibleRatio(el)).toBe(0)
    vi.restoreAllMocks()
  })

  it('handles vertical clipping by overflow:hidden parent', () => {
    // Parent is 50px tall with overflow:hidden, element is 100px tall
    const el = createMockElement(
      { top: 0, left: 100, width: 200, height: 100 },
      [{ rect: { top: 0, left: 0, width: 1024, height: 50 }, overflowX: 'visible', overflowY: 'hidden' }],
    )
    const ratio = getElementVisibleRatio(el)
    expect(ratio).toBeCloseTo(0.5)
    vi.restoreAllMocks()
  })

  it('handles overflow:auto the same as overflow:hidden', () => {
    const el = createMockElement(
      { top: 100, left: 0, width: 200, height: 100 },
      [{ rect: { top: 0, left: 0, width: 100, height: 768 }, overflowX: 'auto', overflowY: 'visible' }],
    )
    const ratio = getElementVisibleRatio(el)
    expect(ratio).toBeCloseTo(0.5)
    vi.restoreAllMocks()
  })
})
