import type { Step } from '@flowsterix/core'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseHudStateResult } from '../useHudState'
import { useTourHud } from '../useTourHud'
import type { TourTargetInfo } from '../useTourTarget'

const mockUseTour = vi.fn()
const mockUseHudState = vi.fn()
const mockUseConstrainedScrollLock = vi.fn((_options: unknown) => ({
  isConstrainedMode: false,
}))
const mockUseHudShortcuts = vi.fn()

vi.mock('../../context', () => ({
  useTour: () => mockUseTour(),
}))

vi.mock('../useHudState', () => ({
  useHudState: () => mockUseHudState(),
}))

vi.mock('../useConstrainedScrollLock', () => ({
  useConstrainedScrollLock: (options: unknown) =>
    mockUseConstrainedScrollLock(options),
}))

vi.mock('../useViewportRect', () => ({
  useViewportRect: () => ({
    top: 0,
    left: 0,
    width: 1280,
    height: 720,
    right: 1280,
    bottom: 720,
  }),
}))

vi.mock('../useHudDescription', () => ({
  useHudDescription: () => ({
    targetDescription: null,
    descriptionId: undefined,
    combinedAriaDescribedBy: undefined,
  }),
}))

vi.mock('../useHudTargetIssue', () => ({
  useHudTargetIssue: () => ({
    issue: null,
    rawIssue: null,
  }),
}))

vi.mock('../useHudShortcuts', () => ({
  useHudShortcuts: (target: unknown, options: unknown) =>
    mockUseHudShortcuts(target, options),
}))

const createTarget = (overrides: Partial<TourTargetInfo> = {}): TourTargetInfo => ({
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

const createStep = (overrides: Partial<Step<ReactNode>> = {}): Step<ReactNode> => ({
  id: 'step-1',
  target: { selector: '[data-tour-target="demo"]' },
  content: null,
  ...overrides,
})

const createHudState = (
  overrides: Partial<UseHudStateResult> = {},
): UseHudStateResult => {
  const hudTarget = createTarget()
  return {
    state: null,
    runningState: null,
    runningStep: createStep(),
    shouldRender: true,
    canRenderStep: true,
    focusTrapActive: true,
    target: hudTarget,
    hudTarget,
    flowHudOptions: null,
    hudRenderMode: 'default',
    matchesFlowFilter: true,
    activeFlowId: 'flow-1',
    isInGracePeriod: false,
    ...overrides,
  }
}

const Harness = ({ onUpdate }: { onUpdate: (value: ReturnType<typeof useTourHud>) => void }) => {
  const result = useTourHud({
    overlayPadding: 24,
    scrollLockBottomInset: 120,
  })

  useEffect(() => {
    onUpdate(result)
  }, [onUpdate, result])

  return null
}

describe('useTourHud', () => {
  beforeEach(() => {
    mockUseTour.mockReset()
    mockUseHudState.mockReset()
    mockUseConstrainedScrollLock.mockReset()
    mockUseConstrainedScrollLock.mockReturnValue({ isConstrainedMode: false })
    mockUseHudShortcuts.mockReset()

    mockUseTour.mockReturnValue({
      backdropInteraction: 'passthrough',
      lockBodyScroll: true,
    })
  })

  it('bypasses constrained-scroll inputs for screen targets', () => {
    mockUseHudState.mockReturnValue(
      createHudState({
        runningStep: createStep({
          target: 'screen',
          targetBehavior: {
            scrollMargin: { top: 32, bottom: 28 },
          },
        }),
        hudTarget: createTarget({
          isScreen: true,
          rect: {
            top: 0,
            left: 0,
            width: 1280,
            height: 720,
            right: 1280,
            bottom: 720,
          },
          rectSource: 'viewport',
        }),
      }),
    )

    const onUpdate = vi.fn()
    render(<Harness onUpdate={onUpdate} />)

    expect(mockUseConstrainedScrollLock).toHaveBeenCalled()
    const lastCall = mockUseConstrainedScrollLock.mock.lastCall?.[0] as
      | Record<string, unknown>
      | undefined
    expect(lastCall).toBeDefined()
    expect(lastCall).toMatchObject({
      enabled: true,
      targetRect: null,
      padding: 0,
      bottomInset: 0,
      topInset: 0,
      bottomMargin: 0,
    })
  })

  it('preserves constrained-scroll inputs for element targets', () => {
    const targetRect = {
      top: 120,
      left: 40,
      width: 900,
      height: 860,
      right: 940,
      bottom: 980,
    }

    mockUseHudState.mockReturnValue(
      createHudState({
        runningStep: createStep({
          targetBehavior: {
            scrollMargin: { top: 20, bottom: 36 },
          },
        }),
        hudTarget: createTarget({
          isScreen: false,
          rect: targetRect,
        }),
      }),
    )

    const onUpdate = vi.fn()
    render(<Harness onUpdate={onUpdate} />)

    expect(mockUseConstrainedScrollLock).toHaveBeenCalled()
    const lastCall = mockUseConstrainedScrollLock.mock.lastCall?.[0] as
      | Record<string, unknown>
      | undefined
    expect(lastCall).toBeDefined()
    expect(lastCall).toMatchObject({
      enabled: true,
      targetRect,
      padding: 24,
      bottomInset: 120,
      topInset: 20,
      bottomMargin: 36,
    })
  })
})
