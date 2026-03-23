import { useEffect, useRef } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { isBrowser } from '../utils/dom'
import { rectIntersectsViewport } from './settleUtils'
import type { StepTransitionPhase } from './useStepTransitionPhase'
import type { TourTargetInfo } from './useTourTarget'

// =============================================================================
// Types
// =============================================================================

export interface CachedTarget {
  rect: ClientRectLike
  isScreen: boolean
  stepId: string | null
}

export interface UseTargetPromotionOptions {
  target: TourTargetInfo
  viewport: ClientRectLike
  phase?: StepTransitionPhase
  isInGracePeriod?: boolean
}

export interface TargetPromotionState {
  /** Whether the live rect can be promoted this frame. */
  liveRectCanPromote: boolean
  /** target.status === 'ready' && liveRectCanPromote */
  liveTargetUsable: boolean
  /** Previous step's target still cached (new step not yet promoted). */
  isTransitioningBetweenSteps: boolean
  /** The promoted target or last-promoted fallback. */
  cachedTarget: CachedTarget | null
}

// =============================================================================
// Hook
// =============================================================================

export const useTargetPromotion = ({
  target,
  viewport,
  phase,
  isInGracePeriod = false,
}: UseTargetPromotionOptions): TargetPromotionState => {
  const lastReadyTargetRef = useRef<CachedTarget | null>(null)
  const previousCachedTarget = lastReadyTargetRef.current

  const liveRectCanPromote = Boolean(
    target.isScreen ||
      (target.rect &&
        rectIntersectsViewport(target.rect, viewport) &&
        (phase === undefined || phase === 'ready')),
  )

  const liveTargetUsable = Boolean(
    target.status === 'ready' && liveRectCanPromote,
  )

  const promotedTarget =
    liveTargetUsable && target.rect
      ? {
          rect: { ...target.rect },
          isScreen: target.isScreen,
          stepId: target.stepId ?? null,
        }
      : null

  if (promotedTarget) {
    lastReadyTargetRef.current = promotedTarget
  }

  const cachedTarget = promotedTarget ?? previousCachedTarget

  // Compute after promotion so it reflects the current render's state.
  // Using `cachedTarget` (not `previousCachedTarget`) avoids a stale-by-one-render
  // bug: if the fade-hold timer expires before the coordinator reaches 'ready',
  // nothing would trigger the extra re-render needed to clear the old ref snapshot,
  // leaving `isTransitioningBetweenSteps` stuck true and the highlight permanently hidden.
  const isTransitioningBetweenSteps = Boolean(
    cachedTarget &&
      target.stepId &&
      cachedTarget.stepId &&
      cachedTarget.stepId !== target.stepId,
  )

  useEffect(() => {
    if (!isBrowser) return
    if (target.status === 'idle' && !isInGracePeriod) {
      lastReadyTargetRef.current = null
    }
  }, [isInGracePeriod, target.status])

  return {
    liveRectCanPromote,
    liveTargetUsable,
    isTransitioningBetweenSteps,
    cachedTarget,
  }
}
