import { describe, expect, it } from 'vitest'

import { createRect } from '../../utils/dom'
import { computeConstrainedScrollBounds } from '../useConstrainedScrollLock'

describe('computeConstrainedScrollBounds', () => {
  it('respects top and bottom scroll margins in constrained bounds', () => {
    const targetRect = createRect({
      top: 200,
      left: 0,
      width: 320,
      height: 900,
    })

    const bounds = computeConstrainedScrollBounds({
      targetRect,
      currentScrollY: 1000,
      viewportHeight: 800,
      bottomInset: 100,
      topInset: 80,
      bottomMargin: 20,
    })

    expect(bounds).toEqual({
      minY: 1120,
      maxY: 1420,
    })
  })

  it('clamps bounds to non-negative values and keeps maxY >= minY', () => {
    const targetRect = createRect({
      top: -300,
      left: 0,
      width: 320,
      height: 500,
    })

    const bounds = computeConstrainedScrollBounds({
      targetRect,
      currentScrollY: 50,
      viewportHeight: 700,
      topInset: 120,
      bottomInset: 80,
      bottomMargin: 40,
      padding: 12,
    })

    expect(bounds.minY).toBeGreaterThanOrEqual(0)
    expect(bounds.maxY).toBeGreaterThanOrEqual(bounds.minY)
  })
})
