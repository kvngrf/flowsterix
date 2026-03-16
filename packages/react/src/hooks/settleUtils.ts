import type { ClientRectLike } from '../utils/dom'

// =============================================================================
// Constants
// =============================================================================

export const STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD = 0.9
export const STEP_TRANSITION_OVERSIZED_VIEWPORT_COVERAGE_THRESHOLD = 0.9
export const STEP_TRANSITION_SCROLL_SETTLE_MS = 90
export const STEP_TRANSITION_MOVEMENT_THRESHOLD = 0.6
export const STEP_TRANSITION_PROMOTE_SPEED_THRESHOLD = 0.5
export const SPEED_SMOOTHING_FACTOR = 0.3

/** Number of consecutive RAF frames with < 0.5px rect movement to confirm settle. */
export const SETTLE_FRAME_COUNT = 6

/** Threshold in px for rect movement between frames. */
export const SETTLE_RECT_THRESHOLD = 0.5

/** Maximum number of scroll-into-view retry attempts. */
export const MAX_SCROLL_ATTEMPTS = 2

// =============================================================================
// Functions
// =============================================================================

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

export const hasStableVisibilityForStepTransition = (
  rect: ClientRectLike,
  viewport: ClientRectLike,
) => {
  if (rect.width <= 0 || rect.height <= 0) return false

  const visibleWidth = visibleSpan(rect.left, rect.right, viewport.width)
  const visibleHeight = visibleSpan(rect.top, rect.bottom, viewport.height)
  const oversizedWidth = rect.width > viewport.width
  const oversizedHeight = rect.height > viewport.height

  const widthStable = oversizedWidth
    ? visibleWidth >=
      viewport.width * STEP_TRANSITION_OVERSIZED_VIEWPORT_COVERAGE_THRESHOLD
    : visibleWidth / rect.width >= STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD

  const heightStable = oversizedHeight
    ? visibleHeight >=
      viewport.height * STEP_TRANSITION_OVERSIZED_VIEWPORT_COVERAGE_THRESHOLD
    : visibleHeight / rect.height >= STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD

  return widthStable && heightStable
}

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
