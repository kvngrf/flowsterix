import type { ClientRectLike } from '../utils/dom'
import { isBrowser } from '../utils/dom'

// =============================================================================
// Constants
// =============================================================================

export const STEP_TRANSITION_SCROLL_SETTLE_MS = 90
export const STEP_TRANSITION_MOVEMENT_THRESHOLD = 0.6
export const STEP_TRANSITION_PROMOTE_SPEED_THRESHOLD = 0.5
export const SPEED_SMOOTHING_FACTOR = 0.3

/** Number of consecutive RAF frames with < 0.5px rect movement to confirm settle. */
export const SETTLE_FRAME_COUNT = 6

/**
 * Rect-delta thresholds — each serves a different detection purpose:
 *
 * - `RAF_RECT_THRESHOLD` (0.25px): RAF monitor sensitivity in useTourTarget.
 *   Catches sub-pixel layout shifts so the overlay/popover stay locked to the
 *   target element between coordinator cycles.
 *
 * - `SETTLE_RECT_THRESHOLD` (0.5px): Settle detection in the coordinator.
 *   Confirms scrolling has stopped — slightly coarser than the RAF monitor to
 *   avoid false negatives from sub-pixel rounding during smooth scroll.
 *
 * - `STEP_TRANSITION_MOVEMENT_THRESHOLD` (0.6px): Movement/drift detection in
 *   rectMoved. Used for speed calculations and coordinator phase transitions.
 */
export const RAF_RECT_THRESHOLD = 0.25

/** Threshold in px for rect movement between frames. */
export const SETTLE_RECT_THRESHOLD = 0.5

/** Maximum number of scroll-into-view retry attempts. */
export const MAX_SCROLL_ATTEMPTS = 2

/**
 * Minimum visible-area ratio (0–1) for an element to be considered "fully shown".
 * Accounts for ancestor overflow clipping (e.g. expanding sidebar/accordion).
 */
export const SETTLE_VISIBILITY_THRESHOLD = 0.85

/**
 * Maximum time (ms) to wait for an element to become fully visible after its
 * rect has settled. Safety valve so the coordinator doesn't wait forever if a
 * parent never fully reveals the element.
 */
export const MAX_VISIBILITY_WAIT_MS = 3000

// =============================================================================
// Functions
// =============================================================================

import type { StepTransitionPhase } from './useStepTransitionPhase'

/** Whether the coordinator is actively transitioning (not idle or ready). */
export const isCoordinatorTransitioning = (
  phase: StepTransitionPhase | undefined,
): boolean =>
  phase !== undefined && phase !== 'ready' && phase !== 'idle'

/** Whether two rects are within a given threshold on all edges. */
export const rectDeltaWithinThreshold = (
  a: ClientRectLike,
  b: ClientRectLike,
  threshold: number,
): boolean =>
  Math.abs(a.top - b.top) <= threshold &&
  Math.abs(a.left - b.left) <= threshold &&
  Math.abs(a.width - b.width) <= threshold &&
  Math.abs(a.height - b.height) <= threshold

export const rectIntersectsViewport = (
  rect: ClientRectLike,
  viewport: ClientRectLike,
) =>
  rect.bottom > 0 &&
  rect.right > 0 &&
  rect.top < viewport.height &&
  rect.left < viewport.width

export const visibleSpan = (start: number, end: number, boundary: number) =>
  Math.max(0, Math.min(end, boundary) - Math.max(start, 0))

export const rectMoved = (
  previous: ClientRectLike,
  current: ClientRectLike,
  threshold = STEP_TRANSITION_MOVEMENT_THRESHOLD,
) =>
  Math.abs(previous.top - current.top) > threshold ||
  Math.abs(previous.left - current.left) > threshold ||
  Math.abs(previous.width - current.width) > threshold ||
  Math.abs(previous.height - current.height) > threshold

export const rectPositionDistance = (
  previous: ClientRectLike,
  current: ClientRectLike,
) => Math.hypot(previous.left - current.left, previous.top - current.top)

/**
 * Check whether `scrollend` event is supported on the current platform.
 * Cached after first call.
 */
let _scrollendSupported: boolean | null = null
export const isScrollendSupported = (): boolean => {
  if (_scrollendSupported !== null) return _scrollendSupported
  if (typeof window === 'undefined') {
    _scrollendSupported = false
    return false
  }
  _scrollendSupported = 'onscrollend' in window
  return _scrollendSupported
}

/**
 * Check whether target rect is within viewport with the given margin.
 * Used by the coordinator to decide if a retry scroll is needed.
 */
export const isRectInViewport = (
  rect: ClientRectLike,
  viewport: ClientRectLike,
  margin: { top: number; bottom: number; left: number; right: number },
) => {
  const fitsHeight =
    rect.height <= viewport.height - (margin.top + margin.bottom)
  const fitsWidth =
    rect.width <= viewport.width - (margin.left + margin.right)

  const verticalOk = fitsHeight
    ? rect.top >= margin.top &&
      rect.bottom <= viewport.height - margin.bottom
    : rect.top <= margin.top &&
      rect.bottom >= viewport.height - margin.bottom

  const horizontalOk = fitsWidth
    ? rect.left >= margin.left &&
      rect.right <= viewport.width - margin.right
    : rect.left <= margin.left &&
      rect.right >= viewport.width - margin.right

  return verticalOk && horizontalOk
}

/**
 * Compute the ratio (0–1) of the element's area that is actually visible,
 * accounting for ancestor elements with overflow clipping.
 *
 * Walks up the DOM tree and intersects the element's bounding rect with each
 * ancestor that creates a clipping context (`overflow` !== `visible`).
 * Returns 0 when the element is fully clipped, 1 when fully visible.
 *
 * Only called after the coordinator confirms rect stability (not every frame),
 * so the per-frame cost of `getComputedStyle` is bounded.
 */
export const getElementVisibleRatio = (element: Element): number => {
  if (!isBrowser) return 1
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return 0

  let top = rect.top
  let left = rect.left
  let right = rect.right
  let bottom = rect.bottom

  let current = element.parentElement
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const style = window.getComputedStyle(current)
    const clipX = style.overflowX !== 'visible'
    const clipY = style.overflowY !== 'visible'

    if (clipX || clipY) {
      const pr = current.getBoundingClientRect()
      if (clipX) {
        left = Math.max(left, pr.left)
        right = Math.min(right, pr.right)
      }
      if (clipY) {
        top = Math.max(top, pr.top)
        bottom = Math.min(bottom, pr.bottom)
      }
    }

    current = current.parentElement
  }

  const visibleWidth = Math.max(0, right - left)
  const visibleHeight = Math.max(0, bottom - top)
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = rect.width * rect.height

  return visibleArea / totalArea
}
