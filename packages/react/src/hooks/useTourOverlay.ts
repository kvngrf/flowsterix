import type { BackdropInteractionMode } from '@flowsterix/core'
import { useMemo } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { expandRect, getViewportRect } from '../utils/dom'
import type { StepTransitionPhase } from './useStepTransitionPhase'
import { useTargetPromotion } from './useTargetPromotion'
import type { CachedTarget } from './useTargetPromotion'
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
  /**
   * Current phase of the step transition coordinator.
   * When provided, rect promotion is gated behind `phase === 'ready'`.
   */
  phase?: StepTransitionPhase
}

export interface UseTourOverlayResult {
  /**
   * Whether the overlay is actively highlighting a resolved target.
   */
  isActive: boolean
  /**
   * Metrics for the highlight cutout.
   */
  highlight: {
    rect: TourOverlayRect | null
    centerX: number
    centerY: number
    target: TourTargetInfo | CachedTarget | null
    isScreen: boolean
  }
  /**
   * Rectangles that block pointer interaction when `interactionMode` is `block`.
   */
  blockerSegments: Array<TourOverlaySegment> | null
  /**
   * Whether the base overlay layer should be rendered.
   */
  showBaseOverlay: boolean
  /**
   * Cached viewport metrics for downstream calculations.
   */
  viewport: ClientRectLike
}

const DEFAULT_PADDING = 12
const DEFAULT_RADIUS = 12
const DEFAULT_EDGE_BUFFER = 0

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
    phase,
  } = options

  const viewport = getViewportRect()

  const { liveRectCanPromote, cachedTarget } =
    useTargetPromotion({ target, viewport, phase, isInGracePeriod })

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
  const highlightWidth = Math.max(0, expandedRect.width - insetLeft - insetRight)
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

  const isActive =
    target.status === 'ready' ||
    (target.status === 'resolving' && cachedTarget !== null) ||
    isInGracePeriod

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

  const showBaseOverlay = isActive && !hasHighlightBounds

  return {
    isActive,
    highlight: {
      rect: highlightRect,
      centerX: highlightCenterX,
      centerY: highlightCenterY,
      target: highlightTarget ?? null,
      isScreen: resolvedIsScreen,
    },
    blockerSegments,
    showBaseOverlay,
    viewport,
  }
}
