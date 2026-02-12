import type { BackdropInteractionMode } from '@flowsterix/core'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ClientRectLike } from '../utils/dom'
import {
  expandRect,
  getViewportRect,
  isBrowser,
  supportsMasking,
} from '../utils/dom'
import type { TourTargetInfo } from './useTourTarget'

export interface TourOverlayRect {
  top: number
  left: number
  width: number
  height: number
  radius: number
}

export interface TourOverlaySegment {
  key: string
  top: number
  left: number
  width: number
  height: number
}

export interface UseTourOverlayOptions {
  target: TourTargetInfo
  padding?: number
  radius?: number
  edgeBuffer?: number
  interactionMode?: BackdropInteractionMode
  /**
   * When true, the overlay is in a grace period waiting for the target to resolve.
   * The backdrop will show but without a highlight cutout.
   */
  isInGracePeriod?: boolean
}

export interface UseTourOverlayResult {
  /**
   * W hether the overlay is actively highlighting a resolved target.
   */
  isActive: boolean
  /**
   * M etrics for the highlight cutout.
   */
  highlight: {
    rect: TourOverlayRect | null
    centerX: number
    centerY: number
    target: TourTargetInfo | null
    isScreen: boolean
  }
  /**
   * W hether the overlay can apply a mask to the viewport instead of falling back to segments.
   */
  shouldMask: boolean
  /**
   * I D of the generated mask element, if masking is supported.
   */
  maskId: string | null
  /**
   * C SS url() for the generated mask, if applicable.
   */
  maskUrl?: string
  /**
   * R ectangles that approximate the overlay when masking is unavailable.
   */
  fallbackSegments: Array<TourOverlaySegment> | null
  /**
   * R ectangles that block pointer interaction when `interactionMode` is `block`.
   */
  blockerSegments: Array<TourOverlaySegment> | null
  /**
   * W hether the base overlay layer (with backdrop blur) should be rendered.
   */
  showBaseOverlay: boolean
  /**
   * C ached viewport metrics for downstream calculations.
   */
  viewport: ClientRectLike
}

const DEFAULT_PADDING = 12
const DEFAULT_RADIUS = 12
const DEFAULT_EDGE_BUFFER = 0
const STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD = 0.9
const STEP_TRANSITION_OVERSIZED_VIEWPORT_COVERAGE_THRESHOLD = 0.9
const STEP_TRANSITION_SCROLL_SETTLE_MS = 90
const STEP_TRANSITION_MOVEMENT_THRESHOLD = 0.6
const STEP_TRANSITION_PROMOTE_SPEED_THRESHOLD = 0.5
const SPEED_SMOOTHING_FACTOR = 0.3

const rectIntersectsViewport = (
  rect: ClientRectLike,
  viewport: ClientRectLike,
) =>
  rect.bottom > 0 &&
  rect.right > 0 &&
  rect.top < viewport.height &&
  rect.left < viewport.width

const visibleSpan = (start: number, end: number, boundary: number) =>
  Math.max(0, Math.min(end, boundary) - Math.max(start, 0))

const hasStableVisibilityForStepTransition = (
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

const rectMoved = (
  previous: ClientRectLike,
  current: ClientRectLike,
  threshold = STEP_TRANSITION_MOVEMENT_THRESHOLD,
) =>
  Math.abs(previous.top - current.top) > threshold ||
  Math.abs(previous.left - current.left) > threshold ||
  Math.abs(previous.width - current.width) > threshold ||
  Math.abs(previous.height - current.height) > threshold

const rectPositionDistance = (previous: ClientRectLike, current: ClientRectLike) =>
  Math.hypot(previous.left - current.left, previous.top - current.top)

export const useTourOverlay = (
  options: UseTourOverlayOptions,
): UseTourOverlayResult => {
  const {
    target,
    padding = DEFAULT_PADDING,
    radius = DEFAULT_RADIUS,
    edgeBuffer = DEFAULT_EDGE_BUFFER,
    interactionMode = 'passthrough',
    isInGracePeriod = false,
  } = options

  const hasShownRef = useRef(false)
  const lastReadyTargetRef = useRef<TourTargetInfo | null>(null)
  const [, forceSettleCheck] = useState(0)
  const incomingMotionRef = useRef<{
    stepId: string | null
    lastRect: ClientRectLike | null
    lastMovedAt: number
    lastSampleAt: number
    speedPxPerMs: number
  }>({
    stepId: null,
    lastRect: null,
    lastMovedAt: 0,
    lastSampleAt: 0,
    speedPxPerMs: Number.POSITIVE_INFINITY,
  })
  const viewport = getViewportRect()
  const previousCachedTarget = lastReadyTargetRef.current
  const isTransitioningBetweenSteps = Boolean(
    previousCachedTarget &&
      target.stepId &&
      previousCachedTarget.stepId &&
      previousCachedTarget.stepId !== target.stepId,
  )
  const motion = incomingMotionRef.current
  const currentStepId = target.stepId ?? null
  const now = Date.now()
  if (motion.stepId !== currentStepId) {
    motion.stepId = currentStepId
    motion.lastRect = target.rect ? { ...target.rect } : null
    motion.lastMovedAt = now
    motion.lastSampleAt = now
    motion.speedPxPerMs = Number.POSITIVE_INFINITY
  } else if (!target.rect) {
    motion.lastRect = null
    motion.lastMovedAt = now
    motion.lastSampleAt = now
    motion.speedPxPerMs = Number.POSITIVE_INFINITY
  } else if (!motion.lastRect) {
    motion.lastRect = { ...target.rect }
    motion.lastMovedAt = now
    motion.lastSampleAt = now
    motion.speedPxPerMs = Number.POSITIVE_INFINITY
  } else {
    const elapsedMs = Math.max(1, now - motion.lastSampleAt)
    const sampleSpeedPxPerMs =
      rectPositionDistance(motion.lastRect, target.rect) / elapsedMs
    const previousSpeed =
      Number.isFinite(motion.speedPxPerMs) ? motion.speedPxPerMs : sampleSpeedPxPerMs
    motion.speedPxPerMs =
      previousSpeed * (1 - SPEED_SMOOTHING_FACTOR) +
      sampleSpeedPxPerMs * SPEED_SMOOTHING_FACTOR
    motion.lastSampleAt = now

    if (rectMoved(motion.lastRect, target.rect)) {
      motion.lastMovedAt = now
    }
    motion.lastRect = { ...target.rect }
  }
  const incomingRectSettledByTime =
    !target.rect || now - motion.lastMovedAt >= STEP_TRANSITION_SCROLL_SETTLE_MS
  const incomingRectSlowEnough =
    Number.isFinite(motion.speedPxPerMs) &&
    motion.speedPxPerMs <= STEP_TRANSITION_PROMOTE_SPEED_THRESHOLD
  const incomingRectSettled = incomingRectSettledByTime || incomingRectSlowEnough
  const requiresSettleBeforePromote = Boolean(
    isTransitioningBetweenSteps && target.rectSource === 'live' && target.rect,
  )
  const settleRemainingMs = Math.max(
    0,
    STEP_TRANSITION_SCROLL_SETTLE_MS - (now - motion.lastMovedAt),
  )

  useEffect(() => {
    if (!isBrowser) return
    if (!requiresSettleBeforePromote) return
    if (incomingRectSettled) return

    const timeoutId = window.setTimeout(() => {
      forceSettleCheck((value) => value + 1)
    }, settleRemainingMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    forceSettleCheck,
    incomingRectSettled,
    requiresSettleBeforePromote,
    settleRemainingMs,
  ])

  const liveRectCanPromote = Boolean(
    target.isScreen ||
      (target.rect &&
        rectIntersectsViewport(target.rect, viewport) &&
        (!isTransitioningBetweenSteps ||
          hasStableVisibilityForStepTransition(target.rect, viewport)) &&
        (!requiresSettleBeforePromote || incomingRectSettled)),
  )

  const promotedTarget =
    target.status === 'ready' && liveRectCanPromote
      ? {
          ...target,
          rect: target.rect ? { ...target.rect } : null,
        }
      : null

  if (promotedTarget) {
    hasShownRef.current = true
    lastReadyTargetRef.current = promotedTarget
  }

  const cachedTarget = promotedTarget ?? previousCachedTarget

  useEffect(() => {
    if (!isBrowser) return
    // Only clear when truly idle (no step), not during step transitions.
    if (target.status === 'idle' && !isInGracePeriod) {
      hasShownRef.current = false
      lastReadyTargetRef.current = null
    }
  }, [isInGracePeriod, target.status])

  const highlightTarget =
    target.status === 'ready' && liveRectCanPromote ? target : cachedTarget

  const resolvedRect =
    highlightTarget?.rect ?? (cachedTarget ? null : (target.rect ?? null))
  const resolvedIsScreen = highlightTarget?.isScreen ?? target.isScreen

  const expandedRect =
    resolvedIsScreen || !resolvedRect
      ? viewport
      : expandRect(resolvedRect, padding)

  const safeBuffer = Math.max(0, edgeBuffer)
  const insetTop =
    expandedRect.top <= 0
      ? Math.min(safeBuffer, Math.max(0, expandedRect.height) / 2)
      : 0
  const insetLeft =
    expandedRect.left <= 0
      ? Math.min(safeBuffer, Math.max(0, expandedRect.width) / 2)
      : 0
  const insetBottom =
    expandedRect.top + expandedRect.height >= viewport.height
      ? Math.min(safeBuffer, Math.max(0, expandedRect.height) / 2)
      : 0
  const insetRight =
    expandedRect.left + expandedRect.width >= viewport.width
      ? Math.min(safeBuffer, Math.max(0, expandedRect.width) / 2)
      : 0

  const highlightTop = expandedRect.top + insetTop
  const highlightLeft = expandedRect.left + insetLeft
  const highlightWidth = Math.max(
    0,
    expandedRect.width - insetLeft - insetRight,
  )
  const highlightHeight = Math.max(
    0,
    expandedRect.height - insetTop - insetBottom,
  )
  const highlightRadius = Math.max(
    0,
    Math.min(radius, highlightWidth / 2, highlightHeight / 2),
  )

  const highlightCenterX = highlightLeft + highlightWidth / 2
  const highlightCenterY = highlightTop + highlightHeight / 2

  const hasHighlightBounds =
    !!highlightTarget &&
    !resolvedIsScreen &&
    highlightWidth > 0 &&
    highlightHeight > 0

  const highlightRect: TourOverlayRect | null = hasHighlightBounds
    ? {
        top: highlightTop,
        left: highlightLeft,
        width: highlightWidth,
        height: highlightHeight,
        radius: highlightRadius,
      }
    : null

  const maskCapable = useMemo(() => supportsMasking(), [])

  const isActive =
    target.status === 'ready' ||
    (target.status === 'resolving' && cachedTarget !== null) ||
    isInGracePeriod

  const shouldMask = maskCapable && isActive

  const maskId = useMemo(
    () => `tour-overlay-mask-${Math.random().toString(36).slice(2, 10)}`,
    [],
  )
  const maskUrl = shouldMask ? `url(#${maskId})` : undefined

  const fallbackSegments = useMemo(() => {
    if (!isActive || shouldMask || !hasHighlightBounds || !highlightRect) {
      return null
    }

    const topEdge = Math.max(0, Math.min(highlightRect.top, viewport.height))
    const bottomEdge = Math.max(
      topEdge,
      Math.min(highlightRect.top + highlightRect.height, viewport.height),
    )
    const leftEdge = Math.max(0, Math.min(highlightRect.left, viewport.width))
    const rightEdge = Math.max(
      leftEdge,
      Math.min(highlightRect.left + highlightRect.width, viewport.width),
    )
    const middleHeight = Math.max(0, bottomEdge - topEdge)

    return [
      {
        key: 'top',
        top: 0,
        left: 0,
        width: viewport.width,
        height: topEdge,
      },
      {
        key: 'bottom',
        top: bottomEdge,
        left: 0,
        width: viewport.width,
        height: Math.max(0, viewport.height - bottomEdge),
      },
      {
        key: 'left',
        top: topEdge,
        left: 0,
        width: leftEdge,
        height: middleHeight,
      },
      {
        key: 'right',
        top: topEdge,
        left: rightEdge,
        width: Math.max(0, viewport.width - rightEdge),
        height: middleHeight,
      },
    ].filter((segment) => segment.width > 0 && segment.height > 0)
  }, [
    hasHighlightBounds,
    highlightRect,
    isActive,
    shouldMask,
    viewport.height,
    viewport.width,
  ])

  const blockerSegments = useMemo(() => {
    if (interactionMode !== 'block') {
      return null
    }

    if (!hasHighlightBounds || !highlightRect) {
      return [
        {
          key: 'blocker-full',
          top: 0,
          left: 0,
          width: viewport.width,
          height: viewport.height,
        },
      ]
    }

    const topEdge = Math.max(0, Math.min(highlightRect.top, viewport.height))
    const bottomEdge = Math.max(
      topEdge,
      Math.min(highlightRect.top + highlightRect.height, viewport.height),
    )
    const leftEdge = Math.max(0, Math.min(highlightRect.left, viewport.width))
    const rightEdge = Math.max(
      leftEdge,
      Math.min(highlightRect.left + highlightRect.width, viewport.width),
    )
    const middleHeight = Math.max(0, bottomEdge - topEdge)

    return [
      {
        key: 'blocker-top',
        top: 0,
        left: 0,
        width: viewport.width,
        height: topEdge,
      },
      {
        key: 'blocker-bottom',
        top: bottomEdge,
        left: 0,
        width: viewport.width,
        height: Math.max(0, viewport.height - bottomEdge),
      },
      {
        key: 'blocker-left',
        top: topEdge,
        left: 0,
        width: leftEdge,
        height: middleHeight,
      },
      {
        key: 'blocker-right',
        top: topEdge,
        left: rightEdge,
        width: Math.max(0, viewport.width - rightEdge),
        height: middleHeight,
      },
    ].filter((segment) => segment.width > 0 && segment.height > 0)
  }, [
    hasHighlightBounds,
    highlightRect,
    interactionMode,
    viewport.height,
    viewport.width,
  ])

  const showBaseOverlay = isActive && (shouldMask || !hasHighlightBounds)

  return {
    isActive,
    highlight: {
      rect: highlightRect,
      centerX: highlightCenterX,
      centerY: highlightCenterY,
      target: highlightTarget ?? null,
      isScreen: resolvedIsScreen,
    },
    shouldMask,
    maskId: shouldMask ? maskId : null,
    maskUrl,
    fallbackSegments,
    blockerSegments,
    showBaseOverlay,
    viewport,
  }
}
