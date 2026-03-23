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

import type { StepTransitionPhase } from '../useStepTransitionPhase'

const Harness = ({
  target,
  onUpdate,
  phase,
}: {
  target: TourTargetInfo
  onUpdate: (value: ReturnType<typeof useTourOverlay>) => void
  phase?: StepTransitionPhase
}) => {
  const result = useTourOverlay({ target, phase })

  useEffect(() => {
    onUpdate(result)
  }, [onUpdate, result])

  return null
}

let latestSyncResult: ReturnType<typeof useTourOverlay> | null = null

const SyncHarness = ({ target, phase }: { target: TourTargetInfo; phase?: StepTransitionPhase }) => {
  const result = useTourOverlay({ target, phase })
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

  it('suppresses highlight on immediate step switch (fade-out before new position)', () => {
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

    // Highlight is suppressed during step transitions — the overlay fades out
    // rather than morphing to the new position.
    expect(latestSyncResult?.highlight.rect).toBeNull()
    expect(latestSyncResult?.isStepTransitionActive).toBe(true)
    expect(latestSyncResult?.showBaseOverlay).toBe(true)
  })

  it('promotes highlight immediately when new in-viewport target is ready (no phase coordinator)', () => {
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

    const result = onUpdate.mock.calls.at(-1)?.[0] as
      | ReturnType<typeof useTourOverlay>
      | undefined
    // Without a phase coordinator, the new target is promoted immediately
    // when it intersects the viewport. The highlight jumps to the new position.
    expect(result?.highlight.rect).not.toBeNull()
    expect(result?.isStepTransitionActive).toBe(false)
  })

  it('suppresses highlight during step transition when phase coordinator gates promotion', () => {
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
      <SyncHarness target={initialTarget} phase="ready" />,
    )

    const partiallyVisibleTarget = createTarget({
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
        <SyncHarness target={partiallyVisibleTarget} phase="scrolling" />,
      )
    })

    // With phase coordinator in 'scrolling', promotion is blocked and
    // the highlight is suppressed during the step transition.
    expect(latestSyncResult?.highlight.rect).toBeNull()
    expect(latestSyncResult?.isStepTransitionActive).toBe(true)
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

  it('suppresses highlight rect when phase is scrolling (step transition active)', () => {
    render(
      <SyncHarness
        target={createTarget({
          stepId: 'step-a',
          rect: {
            top: 120,
            left: 100,
            width: 220,
            height: 120,
            right: 320,
            bottom: 240,
          },
        })}
        phase="scrolling"
      />,
    )

    expect(latestSyncResult?.highlight.rect).toBeNull()
    expect(latestSyncResult?.isStepTransitionActive).toBe(true)
    expect(latestSyncResult?.showBaseOverlay).toBe(true)
  })

  it('shows highlight rect when phase is ready', () => {
    render(
      <SyncHarness
        target={createTarget({
          stepId: 'step-a',
          rect: {
            top: 120,
            left: 100,
            width: 220,
            height: 120,
            right: 320,
            bottom: 240,
          },
        })}
        phase="ready"
      />,
    )

    expect(latestSyncResult?.highlight.rect).not.toBeNull()
    expect(latestSyncResult?.isStepTransitionActive).toBe(false)
    expect(latestSyncResult?.showBaseOverlay).toBe(false)
  })
})
