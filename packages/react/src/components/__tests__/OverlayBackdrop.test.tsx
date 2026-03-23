import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { UseTourOverlayResult } from '../../hooks/useTourOverlay'
import { OverlayBackdrop } from '../OverlayBackdrop'

const createOverlay = (
  overrides: Partial<UseTourOverlayResult> = {},
): UseTourOverlayResult => ({
  isActive: true,
  highlight: {
    rect: {
      top: 120,
      left: 100,
      width: 220,
      height: 140,
      radius: 16,
    },
    centerX: 210,
    centerY: 190,
    target: null,
    isScreen: false,
  },
  blockerSegments: null,
  showBaseOverlay: false,
  isStepTransitionActive: false,
  viewport: {
    top: 0,
    left: 0,
    width: 390,
    height: 844,
    right: 390,
    bottom: 844,
  },
  ...overrides,
})

describe('OverlayBackdrop', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders svg cutout and highlight ring for active target', () => {
    render(<OverlayBackdrop overlay={createOverlay()} />)

    expect(
      document.querySelector('[data-tour-overlay-layer="svg"]'),
    ).toBeTruthy()
    expect(
      document.querySelector('[data-tour-overlay-layer="highlight-ring"]'),
    ).toBeTruthy()
  })

  it('renders full backdrop when no highlight bounds exist', () => {
    render(
      <OverlayBackdrop
        overlay={createOverlay({
          highlight: {
            rect: null,
            centerX: 0,
            centerY: 0,
            target: null,
            isScreen: true,
          },
          showBaseOverlay: true,
        })}
      />,
    )

    expect(
      document.querySelector('[data-tour-overlay-layer="backdrop"]'),
    ).toBeTruthy()
    expect(
      document.querySelector('[data-tour-overlay-layer="svg"]'),
    ).toBeFalsy()
  })
})
