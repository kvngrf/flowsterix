import type { Step } from '@flowsterix/core'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { act, useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { ClientRectLike } from '../../utils/dom'
import { useHiddenTargetFallback } from '../useHiddenTargetFallback'
import type { TourTargetInfo } from '../useTourTarget'

const VIEWPORT: ClientRectLike = {
  top: 0,
  left: 0,
  width: 1280,
  height: 720,
  right: 1280,
  bottom: 720,
}

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

const createStep = (
  overrides: Partial<Step<ReactNode>> = {},
): Step<ReactNode> => ({
  id: 'step-1',
  target: { selector: '#demo' },
  content: null,
  ...overrides,
})

type HookUpdate = ReturnType<typeof useHiddenTargetFallback>

interface HarnessProps {
  step: Step<ReactNode>
  target: TourTargetInfo
  onSkip: () => void
  onUpdate: (value: HookUpdate) => void
}

const HiddenFallbackHarness = ({
  step,
  target,
  onSkip,
  onUpdate,
}: HarnessProps) => {
  const result = useHiddenTargetFallback({
    step,
    target,
    viewportRect: VIEWPORT,
    onSkip,
  })

  useEffect(() => onUpdate(result), [onUpdate, result])

  return null
}

describe('useHiddenTargetFallback', () => {
  it('switches to a screen-centered fallback when the target stays hidden', () => {
    vi.useFakeTimers()
    try {
      const onSkip = vi.fn()
      const onUpdate = vi.fn()

      const step = createStep({
        targetBehavior: { hidden: 'screen', hiddenDelayMs: 30 },
      })
      const hiddenTarget = createTarget({ visibility: 'hidden' })

      const { rerender } = render(
        <HiddenFallbackHarness
          step={step}
          target={hiddenTarget}
          onSkip={onSkip}
          onUpdate={onUpdate}
        />,
      )

      expect(onSkip).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(30)
      })

      const latest = onUpdate.mock.calls.at(-1)?.[0] as HookUpdate
      expect(latest).toBeDefined()
      expect(latest.usingScreenFallback).toBe(true)
      expect(latest.target.isScreen).toBe(true)
      expect(latest.target.rectSource).toBe('viewport')

      const visibleTarget = createTarget({ visibility: 'visible' })

      act(() => {
        rerender(
          <HiddenFallbackHarness
            step={step}
            target={visibleTarget}
            onSkip={onSkip}
            onUpdate={onUpdate}
          />,
        )
      })

      const afterReset = onUpdate.mock.calls.at(-1)?.[0] as HookUpdate
      expect(afterReset.usingScreenFallback).toBe(false)
      expect(afterReset.target.isScreen).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-skips the hidden step when configured for skip fallback', () => {
    vi.useFakeTimers()
    try {
      const onSkip = vi.fn()
      const onUpdate = vi.fn()

      const step = createStep({
        targetBehavior: { hidden: 'skip', hiddenDelayMs: 25 },
      })
      const hiddenTarget = createTarget({ visibility: 'hidden' })

      render(
        <HiddenFallbackHarness
          step={step}
          target={hiddenTarget}
          onSkip={onSkip}
          onUpdate={onUpdate}
        />,
      )

      act(() => {
        vi.advanceTimersByTime(25)
      })

      expect(onSkip).toHaveBeenCalledTimes(1)
      const latest = onUpdate.mock.calls.at(-1)?.[0] as HookUpdate
      expect(latest.usingScreenFallback).toBe(false)

      act(() => {
        vi.advanceTimersByTime(25)
      })

      expect(onSkip).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
