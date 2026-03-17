import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { ClientRectLike } from '../utils/dom'
import {
  getClientRect,
  getScrollParents,
  getViewportRect,
  isBrowser,
} from '../utils/dom'
import { DEFAULT_SCROLL_MARGIN, resolveScrollMargin } from './scrollMargin'
import {
  getElementVisibleRatio,
  isRectInViewport,
  isScrollendSupported,
  MAX_SCROLL_ATTEMPTS,
  MAX_VISIBILITY_WAIT_MS,
  SETTLE_FRAME_COUNT,
  SETTLE_RECT_THRESHOLD,
  SETTLE_VISIBILITY_THRESHOLD,
} from './settleUtils'
import type { TourTargetInfo } from './useTourTarget'
import { ensureElementInView } from './useTourTarget'

// =============================================================================
// Types
// =============================================================================

export type StepTransitionPhase = 'idle' | 'scrolling' | 'settling' | 'ready'

export interface UseStepTransitionPhaseOptions {
  target: TourTargetInfo
  activeStep: Step<ReactNode> | null
}

export interface UseStepTransitionPhaseResult {
  phase: StepTransitionPhase
  settledRect: ClientRectLike | null
  isTransitioning: boolean
}

// =============================================================================
// Helpers
// =============================================================================

const rectDeltaWithinThreshold = (
  a: ClientRectLike,
  b: ClientRectLike,
  threshold: number,
) =>
  Math.abs(a.top - b.top) <= threshold &&
  Math.abs(a.left - b.left) <= threshold &&
  Math.abs(a.width - b.width) <= threshold &&
  Math.abs(a.height - b.height) <= threshold

// =============================================================================
// Hook
// =============================================================================

/**
 * Coordinates the step transition lifecycle to ensure idempotent UI behavior.
 *
 * Acts as a single source of truth for the phase of a step-to-step transition.
 * Both `useTourOverlay` and `TourPopoverPortal` read `phase` from this hook
 * instead of maintaining independent motion tracking — ensuring they freeze
 * and promote rects in lockstep.
 *
 * Phase model: `idle → scrolling → settling → ready`
 *
 * Settlement detection:
 * - Primary: `scrollend` event (fast-path on supported browsers)
 * - Fallback: 6 consecutive RAF frames with < 0.5px rect movement
 * - Visibility gate: after settling, element must be ≥85% visible (not clipped
 *   by ancestor overflow). Handles targets inside expanding sidebars/accordions.
 *   Safety timeout: 3s.
 *
 * Scroll retry: max 2 attempts if target is not in viewport after settling.
 */
export const useStepTransitionPhase = ({
  target,
  activeStep,
}: UseStepTransitionPhaseOptions): UseStepTransitionPhaseResult => {
  const [phase, setPhase] = useState<StepTransitionPhase>('idle')
  const [settledRect, setSettledRect] = useState<ClientRectLike | null>(null)

  // Internal refs — mutated inside RAF, only commit to state on phase boundaries
  const phaseRef = useRef<StepTransitionPhase>('idle')
  const previousStepIdRef = useRef<string | null>(null)
  const stableFrameCountRef = useRef(0)
  const scrollAttemptRef = useRef(0)
  const lastRectRef = useRef<ClientRectLike | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const scrollendFiredRef = useRef(false)
  const scrollendCleanupRef = useRef<(() => void) | null>(null)
  const visibilityWaitStartRef = useRef<number | null>(null)

  const commitPhase = (nextPhase: StepTransitionPhase, rect?: ClientRectLike | null) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
    if (nextPhase === 'ready' && rect) {
      setSettledRect({ ...rect })
    } else if (nextPhase === 'idle') {
      setSettledRect(null)
    }
  }

  const cancelRaf = () => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }

  const cleanupScrollend = () => {
    scrollendCleanupRef.current?.()
    scrollendCleanupRef.current = null
    scrollendFiredRef.current = false
  }

  const resetInternals = () => {
    cancelRaf()
    cleanupScrollend()
    stableFrameCountRef.current = 0
    scrollAttemptRef.current = 0
    lastRectRef.current = null
    scrollendFiredRef.current = false
    visibilityWaitStartRef.current = null
  }

  // -------------------------------------------------------------------------
  // scrollend listener setup
  // -------------------------------------------------------------------------
  const attachScrollendListeners = (element: Element | null) => {
    cleanupScrollend()
    if (!isScrollendSupported()) return

    const handler = () => {
      scrollendFiredRef.current = true
      // Boost frame count so next stable frame confirms settle
      stableFrameCountRef.current = Math.max(
        stableFrameCountRef.current,
        SETTLE_FRAME_COUNT - 1,
      )
    }

    const targets: Array<EventTarget> = [window]
    if (element) {
      const parents = getScrollParents(element)
      targets.push(...parents)
    }

    for (const t of targets) {
      t.addEventListener('scrollend', handler, { passive: true })
    }

    scrollendCleanupRef.current = () => {
      for (const t of targets) {
        t.removeEventListener('scrollend', handler)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Main effect — reacts to step/target changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isBrowser) return

    const stepId = activeStep?.id ?? null
    const isScreen = activeStep?.target === 'screen'

    // ----- No active step → idle -----
    if (!activeStep || !stepId) {
      resetInternals()
      previousStepIdRef.current = null
      commitPhase('idle')
      return () => resetInternals()
    }

    // ----- Screen target → immediate ready -----
    if (isScreen) {
      resetInternals()
      previousStepIdRef.current = stepId
      commitPhase('ready', getViewportRect())
      return () => resetInternals()
    }

    // ----- Step changed → enter scrolling -----
    const isNewStep = previousStepIdRef.current !== stepId
    if (isNewStep) {
      resetInternals()
      previousStepIdRef.current = stepId
      commitPhase('scrolling')
      // scrollend listeners will be attached once target is ready
    }

    // ----- Target not ready yet → stay in current phase -----
    if (target.status !== 'ready' || !target.element) {
      return () => resetInternals()
    }

    // ----- Target is ready: start RAF monitoring -----
    const element = target.element

    // Attach scrollend listeners on first ready
    if (isNewStep || !scrollendCleanupRef.current) {
      attachScrollendListeners(element)
    }

    // Resolve scroll margin for viewport checks
    const margin = resolveScrollMargin(
      activeStep.targetBehavior?.scrollMargin,
      DEFAULT_SCROLL_MARGIN,
    )

    // Check if element is oversized (skip retry scroll for oversized)
    const viewportRect = getViewportRect()
    const isOversized = () => {
      const rect = getClientRect(element)
      const availH = viewportRect.height - (margin.top + margin.bottom)
      const availW = viewportRect.width - (margin.left + margin.right)
      return rect.height > availH || rect.width > availW
    }

    const tick = () => {
      if (!element.isConnected) {
        rafIdRef.current = window.requestAnimationFrame(tick)
        return
      }

      const currentRect = getClientRect(element)
      const prevRect = lastRectRef.current

      if (
        prevRect &&
        rectDeltaWithinThreshold(prevRect, currentRect, SETTLE_RECT_THRESHOLD)
      ) {
        // Stable frame
        stableFrameCountRef.current += 1
      } else if (!scrollendFiredRef.current) {
        // Movement detected (and scrollend hasn't already confirmed)
        stableFrameCountRef.current = 0
      }

      lastRectRef.current = { ...currentRect }

      // Check if settled
      if (stableFrameCountRef.current >= SETTLE_FRAME_COUNT) {
        const vp = getViewportRect()
        const inView = isRectInViewport(currentRect, vp, margin)

        if (inView || isOversized()) {
          // Check ancestor-clip visibility before promoting.
          // Targets inside expanding containers (sidebar, accordion) may have
          // a stable rect that is in the viewport but visually clipped by a
          // parent with overflow != visible. Wait until sufficiently revealed.
          if (!isOversized()) {
            const visRatio = getElementVisibleRatio(element)
            if (visRatio < SETTLE_VISIBILITY_THRESHOLD) {
              // Element is stable but still clipped — keep waiting
              stableFrameCountRef.current = 0
              if (visibilityWaitStartRef.current === null) {
                visibilityWaitStartRef.current = performance.now()
              } else if (
                performance.now() - visibilityWaitStartRef.current >
                MAX_VISIBILITY_WAIT_MS
              ) {
                // Safety valve: accept after timeout
                visibilityWaitStartRef.current = null
                cleanupScrollend()
                commitPhase('ready', currentRect)
                return
              }
              rafIdRef.current = window.requestAnimationFrame(tick)
              return
            }
          }

          // Settled, in view, and fully visible (or oversized — best effort)
          visibilityWaitStartRef.current = null
          cleanupScrollend()
          commitPhase('ready', currentRect)
          // Don't schedule another frame — we're done
          return
        }

        // Not in view — retry scroll if attempts remain
        if (scrollAttemptRef.current < MAX_SCROLL_ATTEMPTS) {
          scrollAttemptRef.current += 1
          stableFrameCountRef.current = 0
          scrollendFiredRef.current = false

          const scrollMode = activeStep.targetBehavior?.scrollMode ?? 'center'
          const measRect = getClientRect(element)
          const availH = vp.height - (margin.top + margin.bottom)
          const availW = vp.width - (margin.left + margin.right)
          const fitsH = measRect.height <= availH
          const fitsW = measRect.width <= availW
          const resolvedMode = !fitsH || !fitsW ? 'preserve' : scrollMode

          ensureElementInView(element, margin, {
            behavior: 'smooth',
            mode: resolvedMode,
          })

          // Re-attach scrollend for the new scroll
          attachScrollendListeners(element)
        } else {
          // Exhausted retries — accept current position
          cleanupScrollend()
          commitPhase('ready', currentRect)
          return
        }
      }

      // If in settling range but not yet confirmed, update phase display
      if (
        stableFrameCountRef.current > 0 &&
        phaseRef.current === 'scrolling'
      ) {
        phaseRef.current = 'settling'
        setPhase('settling')
      }

      rafIdRef.current = window.requestAnimationFrame(tick)
    }

    // Start monitoring
    cancelRaf()
    rafIdRef.current = window.requestAnimationFrame(tick)

    return () => resetInternals()
  }, [activeStep?.id, activeStep?.target, activeStep?.targetBehavior?.scrollMargin, activeStep?.targetBehavior?.scrollMode, target.status, target.element, target.rect, target.lastUpdated])

  return {
    phase,
    settledRect,
    isTransitioning: phase === 'scrolling' || phase === 'settling',
  }
}
