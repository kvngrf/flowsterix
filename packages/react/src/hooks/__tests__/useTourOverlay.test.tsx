import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TourTargetInfo } from '../useTourTarget'
import { useTourOverlay } from '../useTourOverlay'

const createTarget = (
  overrides: Partial<TourTargetInfo> = {},
): TourTargetInfo => ({
  element: null,
  rect: null,
  lastResolvedRect: null,
  isScreen: false,
  status: 'ready',
  stepId: 'step-1',
  lastUpdated: Date.now(),
  visibility: 'visible',
  rectSource: 'live',
  ...overrides,
})

const Harness = ({
  target,
  onUpdate,
}: {
  target: TourTargetInfo
  onUpdate: (value: ReturnType<typeof useTourOverlay>) => void
}) => {
  const result = useTourOverlay({ target })

  useEffect(() => {
    onUpdate(result)
  }, [onUpdate, result])

  return null
}

let latestSyncResult: ReturnType<typeof useTourOverlay> | null = null

const SyncHarness = ({ target }: { target: TourTargetInfo }) => {
  const result = useTourOverlay({ target })
  latestSyncResult = result
  return null
}

describe('useTourOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-12T09:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    latestSyncResult = null
  })

  it('retains previous highlight on immediate step switch before effects settle', () => {
    const initialTarget = createTarget({
      stepId: 'step-a',
      rect: {
        top: 140,
        left: 120,
        width: 260,
        height: 130,
        right: 380,
        bottom: 270,
      },
    })

    const { rerender } = render(<SyncHarness target={initialTarget} />)

    const offscreenOversizedTarget = createTarget({
      stepId: 'step-b',
      rect: {
        top: 900,
        left: 100,
        width: 320,
        height: 1200,
        right: 420,
        bottom: 2100,
      },
    })

    act(() => {
      rerender(<SyncHarness target={offscreenOversizedTarget} />)
    })

    expect(latestSyncResult?.highlight.target?.stepId).toBe('step-a')
    expect(latestSyncResult?.highlight.rect).not.toBeNull()
  })

  it('keeps previous highlight while oversized incoming target has weak viewport coverage', () => {
    const onUpdate = vi.fn()
    const initialTarget = createTarget({
      stepId: 'step-a',
      rect: {
        top: 120,
        left: 100,
        width: 220,
        height: 120,
        right: 320,
        bottom: 240,
      },
    })

    const { rerender } = render(
      <Harness target={initialTarget} onUpdate={onUpdate} />,
    )

    const partiallyVisibleOversizedTarget = createTarget({
      stepId: 'step-b',
      rect: {
        top: 340,
        left: 80,
        width: 320,
        height: 1000,
        right: 400,
        bottom: 1340,
      },
    })

    act(() => {
      rerender(
        <Harness
          target={partiallyVisibleOversizedTarget}
          onUpdate={onUpdate}
        />,
      )
    })

    act(() => {
      vi.setSystemTime(new Date('2026-02-12T09:00:00.300Z'))
      rerender(
        <Harness
          target={partiallyVisibleOversizedTarget}
          onUpdate={onUpdate}
        />,
      )
    })

    const retained = onUpdate.mock.calls.at(-1)?.[0] as
      | ReturnType<typeof useTourOverlay>
      | undefined
    expect(retained?.highlight.target?.stepId).toBe('step-a')
    expect(retained?.highlight.rect).not.toBeNull()

    const viewportAnchoredOversizedTarget = createTarget({
      stepId: 'step-b',
      rect: {
        top: -120,
        left: 80,
        width: 320,
        height: 1000,
        right: 400,
        bottom: 880,
      },
    })

    act(() => {
      vi.setSystemTime(new Date('2026-02-12T09:00:00.500Z'))
      rerender(
        <Harness target={viewportAnchoredOversizedTarget} onUpdate={onUpdate} />,
      )
    })

    act(() => {
      vi.setSystemTime(new Date('2026-02-12T09:00:00.800Z'))
      rerender(
        <Harness target={viewportAnchoredOversizedTarget} onUpdate={onUpdate} />,
      )
    })

    const promoted = onUpdate.mock.calls.at(-1)?.[0] as
      | ReturnType<typeof useTourOverlay>
      | undefined
    expect(promoted?.highlight.target?.stepId).toBe('step-b')
    expect(promoted?.highlight.rect).not.toBeNull()
  })

  it('returns unified overlay payload with blocker segments', () => {
    render(
      <SyncHarness
        target={createTarget({
          rect: {
            top: 120,
            left: 100,
            width: 220,
            height: 120,
            right: 320,
            bottom: 240,
          },
        })}
      />, 
    )

    expect(latestSyncResult?.isActive).toBe(true)
    expect(latestSyncResult?.highlight.rect).not.toBeNull()
    expect(latestSyncResult?.showBaseOverlay).toBe(false)

    const BlockHarness = ({ target }: { target: TourTargetInfo }) => {
      const result = useTourOverlay({ target, interactionMode: 'block' })
      latestSyncResult = result
      return null
    }

    render(
      <BlockHarness
        target={createTarget({
          rect: {
            top: 120,
            left: 100,
            width: 220,
            height: 120,
            right: 320,
            bottom: 240,
          },
        })}
      />,
    )

    expect(latestSyncResult?.blockerSegments?.length).toBeGreaterThan(0)
  })
})
