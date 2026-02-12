import { describe, expect, it } from 'vitest'

import {
  resolveDisplayedPopoverContentKey,
  resolveLayoutModeForStep,
  shouldAttemptPopoverPositioning,
  shouldApplyFloatingCacheForTarget,
  shouldClearDisplayedStepKey,
  shouldDisableSharedPopoverLayoutForHandoff,
  shouldPersistFloatingCacheForTarget,
  type TourPopoverLayoutMode,
} from '../TourPopoverPortal'

describe('resolveLayoutModeForStep', () => {
  it('forces floating layout for screen target steps on desktop', () => {
    const next = resolveLayoutModeForStep('docked', {
      prefersMobile: false,
      isScreenTarget: true,
    })

    expect(next).toBe('floating')
  })

  it('keeps docked layout for non-screen targets on desktop', () => {
    const next = resolveLayoutModeForStep('docked', {
      prefersMobile: false,
      isScreenTarget: false,
    })

    expect(next).toBe('docked')
  })

  it('converts manual/mobile modes back to floating on desktop step changes', () => {
    const manualNext = resolveLayoutModeForStep('manual', {
      prefersMobile: false,
      isScreenTarget: false,
    })
    const mobileNext = resolveLayoutModeForStep('mobile', {
      prefersMobile: false,
      isScreenTarget: false,
    })

    expect(manualNext).toBe('floating')
    expect(mobileNext).toBe('floating')
  })

  it('always prefers mobile mode on mobile viewports', () => {
    const modes: TourPopoverLayoutMode[] = [
      'floating',
      'docked',
      'manual',
      'mobile',
    ]

    for (const mode of modes) {
      const next = resolveLayoutModeForStep(mode, {
        prefersMobile: true,
        isScreenTarget: true,
      })
      expect(next).toBe('mobile')
    }
  })
})

describe('shouldApplyFloatingCacheForTarget', () => {
  it('applies cache only when target is ready and promotable', () => {
    expect(
      shouldApplyFloatingCacheForTarget({
        targetStatus: 'ready',
        liveTargetUsable: true,
      }),
    ).toBe(true)
  })

  it('does not apply cache while target is resolving', () => {
    expect(
      shouldApplyFloatingCacheForTarget({
        targetStatus: 'resolving',
        liveTargetUsable: false,
      }),
    ).toBe(false)
  })
})

describe('shouldPersistFloatingCacheForTarget', () => {
  it('persists cache only when target is ready and promotable', () => {
    expect(
      shouldPersistFloatingCacheForTarget({
        targetStatus: 'ready',
        liveTargetUsable: true,
      }),
    ).toBe(true)
  })

  it('does not persist cache while preserving previous anchor', () => {
    expect(
      shouldPersistFloatingCacheForTarget({
        targetStatus: 'ready',
        liveTargetUsable: false,
      }),
    ).toBe(false)
  })
})

describe('shouldAttemptPopoverPositioning', () => {
  it('positions when target is ready, has rect, desktop layout, and not screen', () => {
    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'floating',
        isTransitioningBetweenSteps: false,
        liveTargetUsable: true,
      }),
    ).toBe(true)
  })

  it('skips positioning while target is resolving', () => {
    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'resolving',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'floating',
        isTransitioningBetweenSteps: false,
        liveTargetUsable: false,
      }),
    ).toBe(false)
  })

  it('freezes positioning during cross-step handoff until target is promotable', () => {
    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'floating',
        isTransitioningBetweenSteps: true,
        liveTargetUsable: false,
      }),
    ).toBe(false)

    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'floating',
        isTransitioningBetweenSteps: true,
        liveTargetUsable: true,
      }),
    ).toBe(true)
  })

  it('skips positioning for screen targets and mobile/manual layouts', () => {
    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: true,
        layoutMode: 'floating',
        isTransitioningBetweenSteps: false,
        liveTargetUsable: true,
      }),
    ).toBe(false)

    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'mobile',
        isTransitioningBetweenSteps: false,
        liveTargetUsable: true,
      }),
    ).toBe(false)

    expect(
      shouldAttemptPopoverPositioning({
        targetStatus: 'ready',
        hasReferenceRect: true,
        resolvedIsScreen: false,
        layoutMode: 'manual',
        isTransitioningBetweenSteps: false,
        liveTargetUsable: true,
      }),
    ).toBe(false)
  })
})

describe('shouldDisableSharedPopoverLayoutForHandoff', () => {
  it('disables shared layout while handoff is freezing on previous anchor', () => {
    expect(
      shouldDisableSharedPopoverLayoutForHandoff({
        isTransitioningBetweenSteps: true,
        liveTargetUsable: false,
      }),
    ).toBe(true)
  })

  it('keeps shared layout when not in frozen handoff', () => {
    expect(
      shouldDisableSharedPopoverLayoutForHandoff({
        isTransitioningBetweenSteps: false,
        liveTargetUsable: false,
      }),
    ).toBe(false)

    expect(
      shouldDisableSharedPopoverLayoutForHandoff({
        isTransitioningBetweenSteps: true,
        liveTargetUsable: true,
      }),
    ).toBe(false)
  })
})

describe('shouldClearDisplayedStepKey', () => {
  it('clears displayed key only when step is null and no anchor persistence remains', () => {
    expect(
      shouldClearDisplayedStepKey({
        nextStepId: null,
        hasAnchor: false,
        shouldPersistWhileResolving: false,
      }),
    ).toBe(true)

    expect(
      shouldClearDisplayedStepKey({
        nextStepId: null,
        hasAnchor: true,
        shouldPersistWhileResolving: false,
      }),
    ).toBe(false)

    expect(
      shouldClearDisplayedStepKey({
        nextStepId: null,
        hasAnchor: false,
        shouldPersistWhileResolving: true,
      }),
    ).toBe(false)
  })
})

describe('resolveDisplayedPopoverContentKey', () => {
  it('prefers displayed key during transient null step ids', () => {
    expect(
      resolveDisplayedPopoverContentKey({
        displayedStepKey: 'step-a',
        targetStepId: null,
      }),
    ).toBe('step-a')
  })

  it('falls back to target step id when no displayed key exists', () => {
    expect(
      resolveDisplayedPopoverContentKey({
        displayedStepKey: null,
        targetStepId: 'step-b',
      }),
    ).toBe('step-b')
  })

  it('returns undefined only when both keys are absent', () => {
    expect(
      resolveDisplayedPopoverContentKey({
        displayedStepKey: null,
        targetStepId: null,
      }),
    ).toBeUndefined()
  })
})
