import { cleanup, render } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { TourTargetInfo } from '../../hooks/useTourTarget'
import { TourOverlay } from '../TourOverlay'

const createTarget = (): TourTargetInfo => ({
  element: document.createElement('div'),
  rect: {
    top: 10,
    left: 10,
    width: 100,
    height: 40,
    right: 110,
    bottom: 50,
  },
  lastResolvedRect: null,
  isScreen: false,
  status: 'ready',
  stepId: 'step-1',
  lastUpdated: Date.now(),
  visibility: 'visible',
  rectSource: 'live',
})

describe('TourOverlay interaction modes', () => {
  let originalCSSDescriptor: PropertyDescriptor | undefined

  beforeAll(() => {
    originalCSSDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      writable: true,
      value: {
        supports: () => false,
      },
    })
  })

  beforeEach(() => {
    cleanup()
  })

  afterAll(() => {
    if (originalCSSDescriptor) {
      Object.defineProperty(globalThis, 'CSS', originalCSSDescriptor)
    } else {
      delete (globalThis as Record<string, unknown>).CSS
    }
  })

  it('allows pointer events to passthrough by default', () => {
    const target = createTarget()
    render(<TourOverlay target={target} />)

    const overlayRoot = document.querySelector(
      '[data-tour-overlay]',
    ) as HTMLElement
    expect(overlayRoot?.style.pointerEvents).toBe('none')
  })

  it('blocks pointer events when interactionMode="block"', () => {
    const target = createTarget()
    render(<TourOverlay target={target} interactionMode="block" />)

    const overlayRoot = document.querySelector(
      '[data-tour-overlay]',
    ) as HTMLElement
    const blockerLayer = document.querySelector(
      '[data-tour-overlay-layer="interaction-blocker"]',
    )
    const blockerSegments = blockerLayer?.querySelectorAll(
      '[style*="pointer-events: auto"]',
    )

    expect(overlayRoot?.style.pointerEvents).toBe('none')
    expect(blockerLayer).not.toBeNull()
    expect(blockerSegments && blockerSegments.length).toBeGreaterThan(0)
  })
})
