import type {
  CSSProperties,
  ComponentType,
  HTMLAttributes,
  PointerEventHandler,
  ReactNode,
  RefCallback,
} from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { Placement, VirtualElement } from '@floating-ui/dom'
import {
  autoPlacement,
  computePosition,
  flip,
  offset as floatingOffset,
  shift,
} from '@floating-ui/dom'
import type { StepPlacement } from '@flowsterix/core'
import type { MotionProps, MotionStyle, Transition } from 'motion/react'

import type { TourTargetInfo } from '../hooks/useTourTarget'
import { useViewportRect } from '../hooks/useViewportRect'
import type { AnimationAdapterTransitions } from '../motion/animationAdapter'
import { useAnimationAdapter } from '../motion/animationAdapter'
import type { ClientRectLike } from '../utils/dom'
import { getViewportRect, isBrowser, portalHost } from '../utils/dom'

const FLOATING_OFFSET = 8
const DOCKED_MARGIN = 24
const MOBILE_BREAKPOINT = 640
const MOBILE_HEIGHT_BREAKPOINT = 560
const MOBILE_HORIZONTAL_GUTTER = 12
const DEFAULT_POPOVER_ENTRANCE_TRANSITION: Transition = {
  duration: 0.25,
  ease: 'easeOut',
}
const DEFAULT_POPOVER_EXIT_TRANSITION: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}
const DEFAULT_POPOVER_CONTENT_TRANSITION: Transition = {
  duration: 0.4,
  ease: 'easeOut',
}
const STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD = 0.9
const STEP_TRANSITION_OVERSIZED_VISIBILITY_THRESHOLD = 0.35
const STEP_TRANSITION_SCROLL_SETTLE_MS = 90
const STEP_TRANSITION_MOVEMENT_THRESHOLD = 0.6
const STEP_TRANSITION_PROMOTE_SPEED_THRESHOLD = 0.5
const SPEED_SMOOTHING_FACTOR = 0.3

type MotionElementProps = MotionProps &
  Omit<HTMLAttributes<HTMLElement>, 'style'> & {
    style?: CSSProperties | MotionStyle
  }

type MotionElementComponent = ComponentType<MotionElementProps>

type FloatingPositionState = {
  top: number
  left: number
  transform: string
}

const floatingPositionCache = new Map<string, FloatingPositionState>()

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
  const widthRatio = visibleWidth / rect.width
  const heightRatio = visibleHeight / rect.height
  const widthThreshold =
    rect.width <= viewport.width
      ? STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD
      : STEP_TRANSITION_OVERSIZED_VISIBILITY_THRESHOLD
  const heightThreshold =
    rect.height <= viewport.height
      ? STEP_TRANSITION_FITTED_VISIBILITY_THRESHOLD
      : STEP_TRANSITION_OVERSIZED_VISIBILITY_THRESHOLD

  return widthRatio >= widthThreshold && heightRatio >= heightThreshold
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

const getFloatingCacheKey = (target: TourTargetInfo) => {
  if (target.stepId) {
    return `step:${target.stepId}`
  }
  if (target.isScreen) {
    return 'screen'
  }
  return null
}

export type TourPopoverLayoutMode = 'floating' | 'docked' | 'manual' | 'mobile'

export interface TourPopoverPortalRenderProps {
  Container: MotionElementComponent
  Content: MotionElementComponent
  containerProps: MotionElementProps &
    Record<string, unknown> & {
      ref: RefCallback<HTMLElement>
      style: CSSProperties
    }
  contentProps: MotionElementProps &
    Record<string, unknown> & { key?: string | null }
  layoutMode: TourPopoverLayoutMode
  isDragging: boolean
  showDragHandle: boolean
  dragHandleProps: {
    type: 'button'
    'aria-label': string
    style: CSSProperties
    onPointerDown: PointerEventHandler<HTMLButtonElement>
  }
  descriptionProps: {
    id?: string
    text?: string
  }
}

export interface TourPopoverPortalProps {
  target: TourTargetInfo
  children: (props: TourPopoverPortalRenderProps) => ReactNode
  offset?: number
  width?: number | string
  maxWidth?: number | string
  zIndex?: number
  placement?: StepPlacement
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaModal?: boolean
  descriptionId?: string
  descriptionText?: string
  onContainerChange?: (node: HTMLDivElement | null) => void
  layoutId?: string
  containerComponent?: MotionElementComponent
  contentComponent?: MotionElementComponent
  transitionsOverride?: Partial<AnimationAdapterTransitions>
  /**
   * When true, the popover is hidden during the grace period while waiting for target.
   * The backdrop will show but the popover content remains invisible.
   */
  isInGracePeriod?: boolean
  /**
   * Callback reporting the popover's rendered height (plus margin).
   * Use as `scrollLockBottomInset` so constrained scroll lets users
   * reach all highlighted content above the popover.
   */
  onHeightChange?: (height: number) => void
}

export const TourPopoverPortal = ({
  target,
  children,
  offset = 32,
  width,
  maxWidth,
  zIndex = 1001,
  placement,
  role,
  ariaLabel,
  ariaDescribedBy,
  ariaModal,
  descriptionId,
  descriptionText,
  onContainerChange,
  layoutId,
  containerComponent,
  contentComponent,
  transitionsOverride,
  isInGracePeriod = false,
  onHeightChange,
}: TourPopoverPortalProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const adapter = useAnimationAdapter()
  const Container = containerComponent ?? adapter.components.MotionDiv
  const Content = contentComponent ?? adapter.components.MotionDiv

  const popoverEntranceTransition =
    transitionsOverride?.popoverEntrance ??
    adapter.transitions.popoverEntrance ??
    DEFAULT_POPOVER_ENTRANCE_TRANSITION
  const popoverExitTransition =
    transitionsOverride?.popoverExit ??
    adapter.transitions.popoverExit ??
    DEFAULT_POPOVER_EXIT_TRANSITION
  const popoverContentTransition =
    transitionsOverride?.popoverContent ??
    adapter.transitions.popoverContent ??
    DEFAULT_POPOVER_CONTENT_TRANSITION

  const viewport = useViewportRect()
  const [, forceSettleCheck] = useState(0)
  const lastReadyTargetRef = useRef<{
    rect: ClientRectLike
    isScreen: boolean
    stepId: string | null
  } | null>(null)
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
  const cachedTarget = lastReadyTargetRef.current
  const isTransitioningBetweenSteps = Boolean(
    cachedTarget &&
      target.stepId &&
      cachedTarget.stepId &&
      cachedTarget.stepId !== target.stepId,
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
      Number.isFinite(motion.speedPxPerMs)
        ? motion.speedPxPerMs
        : sampleSpeedPxPerMs
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
    isTransitioningBetweenSteps &&
      target.rectSource === 'live' &&
      target.rect &&
      !target.isScreen,
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
  const prefersMobileLayout =
    viewport.width <= MOBILE_BREAKPOINT ||
    viewport.height <= MOBILE_HEIGHT_BREAKPOINT
  const liveTargetUsable = Boolean(
    target.status === 'ready' && liveRectCanPromote,
  )
  const prefersMobileRef = useRef(prefersMobileLayout)
  useEffect(() => {
    prefersMobileRef.current = prefersMobileLayout
  }, [prefersMobileLayout])

  useEffect(() => {
    if (liveTargetUsable && target.rect) {
      lastReadyTargetRef.current = {
        rect: { ...target.rect },
        isScreen: target.isScreen,
        stepId: target.stepId ?? null,
      }
    } else if (target.status === 'idle' && !isInGracePeriod) {
      // Only clear when truly idle, not during step transitions
      // This preserves position for smooth animations between steps
      lastReadyTargetRef.current = null
    }
  }, [
    target.isScreen,
    target.rect,
    target.status,
    target.stepId,
    isInGracePeriod,
    liveTargetUsable,
  ])

  const resolvedRect =
    liveTargetUsable
      ? (target.rect ?? target.lastResolvedRect ?? cachedTarget?.rect ?? null)
      : (cachedTarget?.rect ??
        (cachedTarget ? null : (target.rect ?? target.lastResolvedRect ?? null)))
  const resolvedIsScreen = liveTargetUsable
    ? target.isScreen
    : (cachedTarget?.isScreen ?? target.isScreen)
  const hasResolvedAnchor = Boolean(resolvedRect || resolvedIsScreen)
  const lastStableAnchorRef = useRef<{
    rect: ClientRectLike | null
    isScreen: boolean
  } | null>(null)
  useEffect(() => {
    if (!hasResolvedAnchor) return
    lastStableAnchorRef.current = {
      rect: resolvedRect ? { ...resolvedRect } : null,
      isScreen: resolvedIsScreen,
    }
  }, [hasResolvedAnchor, resolvedIsScreen, resolvedRect])

  const stableAnchor = hasResolvedAnchor ? null : lastStableAnchorRef.current
  const anchoredRect = resolvedRect ?? stableAnchor?.rect ?? null
  const anchoredIsScreen =
    resolvedIsScreen || Boolean(stableAnchor?.isScreen)
  const hasAnchor = Boolean(anchoredRect || anchoredIsScreen)
  const hasLiveStableAnchor = target.status === 'ready' && liveTargetUsable

  // Hide popover when there's no valid rect to position against
  // (screen fallback sets target.isScreen=true and provides viewport rect)
  const shouldHidePopover = !hasAnchor

  const fallbackRect = anchoredRect ?? viewport
  const fallbackIsScreen = anchoredIsScreen

  const [floatingSize, setFloatingSize] = useState<{
    width: number
    height: number
  } | null>(null)

  const clampVertical = (value: number) =>
    Math.min(viewport.height - 24, Math.max(24, value))
  const clampHorizontal = (value: number) =>
    Math.min(viewport.width - 24, Math.max(24, value))

  const screenCenteredTop =
    viewport.height / 2 - (floatingSize?.height ?? 0) / 2
  const screenCenteredLeft = viewport.width / 2 - (floatingSize?.width ?? 0) / 2

  const floatingWidth = floatingSize?.width ?? 0

  const baseTop = fallbackIsScreen
    ? screenCenteredTop
    : fallbackRect.top + fallbackRect.height + offset
  const top = fallbackIsScreen
    ? clampVertical(screenCenteredTop)
    : clampVertical(baseTop)
  const leftBase = fallbackIsScreen
    ? screenCenteredLeft
    : fallbackRect.left + fallbackRect.width / 2 - floatingWidth / 2
  const left = clampHorizontal(leftBase)
  const fallbackTransform = 'translate3d(0px, 0px, 0px)'
  const fallbackPosition = useMemo(
    () => ({
      top,
      left,
      transform: fallbackTransform,
    }),
    [fallbackTransform, left, top],
  )

  const centerInitialPosition = useMemo(
    () => ({
      top: viewport.height / 2,
      left: viewport.width / 2,
      transform: 'translate3d(-50%, -50%, 0px)',
    }),
    [viewport.height, viewport.width],
  )

  const floatingRef = useRef<HTMLElement | null>(null)
  const cachedFloatingPositionRef = useRef<FloatingPositionState | null>(null)
  const appliedFloatingCacheRef = useRef<string | null>(null)
  const deferredScreenSnapRef = useRef<number | null>(null)
  const [layoutMode, setLayoutMode] = useState<TourPopoverLayoutMode>(() =>
    prefersMobileLayout ? 'mobile' : 'floating',
  )
  const [floatingPosition, setFloatingPosition] =
    useState<FloatingPositionState>(fallbackPosition)
  const [dragPosition, setDragPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const overflowRetryRef = useRef<{ stepId: string | null; attempts: number }>({
    stepId: null,
    attempts: 0,
  })
  const overflowRetryTimeoutRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (!isBrowser) return
    const node = floatingRef.current
    if (!node) return

    const updateSize = () => {
      const rect = node.getBoundingClientRect()
      setFloatingSize({ width: rect.width, height: rect.height })
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [target.stepId])

  const resolvedPlacement: StepPlacement = placement ?? 'bottom'
  const isAutoPlacement = resolvedPlacement.startsWith('auto')
  const autoAlignment: 'start' | 'end' | undefined = resolvedPlacement.endsWith(
    '-start',
  )
    ? 'start'
    : resolvedPlacement.endsWith('-end')
      ? 'end'
      : undefined

  useEffect(() => {
    setDragPosition(null)
    setLayoutMode((current) => {
      if (prefersMobileRef.current) return 'mobile'
      if (current === 'manual' || current === 'mobile') return 'floating'
      return current
    })
    appliedFloatingCacheRef.current = null
  }, [target.stepId])

  useEffect(() => {
    if (layoutMode !== 'manual') {
      setDragPosition(null)
    }
  }, [layoutMode])

  useEffect(() => {
    cachedFloatingPositionRef.current = floatingPosition
    const cacheKey = getFloatingCacheKey(target)
    if (cacheKey) {
      floatingPositionCache.set(cacheKey, floatingPosition)
    }
  }, [floatingPosition, target.isScreen, target.stepId])

  const dockedPosition = useMemo(() => {
    if (floatingSize) {
      return {
        top: viewport.height - DOCKED_MARGIN - floatingSize.height,
        left: viewport.width - DOCKED_MARGIN - floatingSize.width,
        transform: 'translate3d(0px, 0px, 0px)',
      }
    }
    // Fallback before first measurement (percentage transform resolves correctly
    // even without explicit size, since floatingSize arrives within one frame)
    return {
      top: viewport.height - DOCKED_MARGIN,
      left: viewport.width - DOCKED_MARGIN,
      transform: 'translate3d(-100%, -100%, 0px)',
    }
  }, [viewport.height, viewport.width, floatingSize])

  const mobilePosition = useMemo(
    () => ({
      top: viewport.height - MOBILE_HORIZONTAL_GUTTER,
      left: viewport.width / 2,
      transform: 'translate3d(-50%, -100%, 0px)',
    }),
    [viewport.height, viewport.width],
  )

  useEffect(() => {
    if (layoutMode === 'docked') {
      setFloatingPosition(dockedPosition)
    }
  }, [dockedPosition, layoutMode])

  // Report popover height for scroll lock bottom inset
  useEffect(() => {
    if (!onHeightChange) return
    onHeightChange(floatingSize ? floatingSize.height + DOCKED_MARGIN : 0)
  }, [floatingSize, onHeightChange])

  useEffect(() => {
    if (layoutMode === 'mobile') {
      setFloatingPosition(mobilePosition)
    }
  }, [layoutMode, mobilePosition])

  useEffect(() => {
    if (prefersMobileLayout) {
      if (layoutMode !== 'mobile') {
        setLayoutMode('mobile')
        setDragPosition(null)
      }
      return
    }
    if (layoutMode === 'mobile') {
      setLayoutMode('floating')
      setFloatingPosition(fallbackPosition)
    }
  }, [fallbackPosition, layoutMode, prefersMobileLayout])

  useEffect(() => {
    if (layoutMode !== 'floating') return
    const stepId = target.stepId
    if (!stepId) return
    if (appliedFloatingCacheRef.current === stepId) return
    const cacheKey = getFloatingCacheKey(target)
    const cached = cacheKey
      ? (floatingPositionCache.get(cacheKey) ?? null)
      : null
    if (cached) {
      appliedFloatingCacheRef.current = stepId
      setFloatingPosition(cached)
      return
    }
    appliedFloatingCacheRef.current = stepId
    if ((target.status !== 'ready' || target.isScreen) && hasAnchor) {
      setFloatingPosition(fallbackPosition)
    }
  }, [
    fallbackPosition,
    hasAnchor,
    layoutMode,
    target.isScreen,
    target.status,
    target.stepId,
  ])

  const shouldDeferScreenSnap =
    layoutMode === 'floating' && target.isScreen && Boolean(layoutId)

  useEffect(() => {
    return () => {
      if (deferredScreenSnapRef.current !== null) {
        cancelAnimationFrame(deferredScreenSnapRef.current)
        deferredScreenSnapRef.current = null
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (layoutMode !== 'floating') return
    if (target.status === 'ready' && !target.isScreen) return
    if (shouldDeferScreenSnap) return
    if (!hasAnchor) return
    setFloatingPosition(fallbackPosition)
  }, [
    fallbackPosition,
    hasAnchor,
    layoutMode,
    shouldDeferScreenSnap,
    target.isScreen,
    target.status,
  ])

  useEffect(() => {
    if (!shouldDeferScreenSnap) return
    if (deferredScreenSnapRef.current !== null) {
      cancelAnimationFrame(deferredScreenSnapRef.current)
      deferredScreenSnapRef.current = null
    }
    let nextFrame: number | null = null
    deferredScreenSnapRef.current = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => {
        setFloatingPosition(fallbackPosition)
        deferredScreenSnapRef.current = null
        if (nextFrame !== null) {
          cancelAnimationFrame(nextFrame)
        }
      })
    })
    return () => {
      if (deferredScreenSnapRef.current !== null) {
        cancelAnimationFrame(deferredScreenSnapRef.current)
        deferredScreenSnapRef.current = null
      }
      if (nextFrame !== null) {
        cancelAnimationFrame(nextFrame)
        nextFrame = null
      }
    }
  }, [fallbackPosition, shouldDeferScreenSnap])

  useEffect(() => {
    return () => {
      if (overflowRetryTimeoutRef.current !== null) {
        window.clearTimeout(overflowRetryTimeoutRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (!isBrowser) return
    const floatingEl = floatingRef.current
    const rectInfo = liveTargetUsable
      ? (target.rect ?? target.lastResolvedRect ?? null)
      : null
    if (!floatingEl) return
    if (!liveTargetUsable) return
    if (target.status !== 'ready') return
    if (!rectInfo || resolvedIsScreen) return
    if (layoutMode === 'mobile' || layoutMode === 'manual') return

    const cancelState = { cancelled: false }
    const retryState = overflowRetryRef.current
    const currentStepId = target.stepId ?? null
    if (retryState.stepId !== currentStepId) {
      retryState.stepId = currentStepId
      retryState.attempts = 0
    }

    const clearRetryTimeout = () => {
      if (overflowRetryTimeoutRef.current !== null) {
        window.clearTimeout(overflowRetryTimeoutRef.current)
        overflowRetryTimeoutRef.current = null
      }
    }

    const virtualReference: VirtualElement = {
      contextElement: liveTargetUsable ? (target.element ?? undefined) : undefined,
      getBoundingClientRect: () =>
        DOMRectReadOnly.fromRect({
          width: rectInfo.width,
          height: rectInfo.height,
          x: rectInfo.left,
          y: rectInfo.top,
        }),
    }

    const computePlacement: Placement | undefined = isAutoPlacement
      ? undefined
      : (resolvedPlacement as Placement)

    const middleware = [
      floatingOffset(offset),
      ...(isAutoPlacement
        ? [
            autoPlacement({
              padding: FLOATING_OFFSET,
              alignment: autoAlignment,
            }),
          ]
        : [
            flip({
              padding: FLOATING_OFFSET,
              fallbackStrategy: 'bestFit',
              crossAxis: true,
              fallbackPlacements: ['bottom', 'top', 'right', 'left'],
            }),
          ]),
      shift({ padding: FLOATING_OFFSET }),
    ]

    const updatePosition = async () => {
      const { x, y } = await computePosition(virtualReference, floatingEl, {
        placement: computePlacement,
        strategy: 'fixed',
        middleware,
      })

      if (cancelState.cancelled) return

      const floatingBox = floatingEl.getBoundingClientRect()
      const viewportRect = getViewportRect()
      const viewportTop = viewportRect.top
      const viewportBottom = viewportRect.top + viewportRect.height
      const viewportLeft = viewportRect.left
      const viewportRight = viewportRect.left + viewportRect.width
      const overflowLeft = Math.max(0, viewportRect.left + FLOATING_OFFSET - x)
      const overflowRight = Math.max(
        0,
        x +
          floatingBox.width +
          FLOATING_OFFSET -
          (viewportRect.left + viewportRect.width),
      )
      const overflowTop = Math.max(0, viewportRect.top + FLOATING_OFFSET - y)
      const overflowBottom = Math.max(
        0,
        y +
          floatingBox.height +
          FLOATING_OFFSET -
          (viewportRect.top + viewportRect.height),
      )

      const maxOverflow = Math.max(
        overflowTop,
        overflowRight,
        overflowBottom,
        overflowLeft,
      )

      const viewportHeight = viewportRect.height
      const viewportWidth = viewportRect.width
      const overflowThreshold = Math.max(
        FLOATING_OFFSET * 2,
        viewportHeight * 0.05,
        viewportWidth * 0.05,
      )

      const targetRect = rectInfo
      const intersectsViewport =
        targetRect.bottom > viewportTop + FLOATING_OFFSET &&
        targetRect.top < viewportBottom - FLOATING_OFFSET &&
        targetRect.right > viewportLeft + FLOATING_OFFSET &&
        targetRect.left < viewportRight - FLOATING_OFFSET

      // Calculate available space around the target for popover placement
      const spaceAbove = targetRect.top - viewportTop
      const spaceBelow = viewportBottom - targetRect.bottom
      const spaceLeft = targetRect.left - viewportLeft
      const spaceRight = viewportRight - targetRect.right

      // Minimum space needed to place the popover on each axis
      const minVerticalSpaceNeeded = floatingBox.height + FLOATING_OFFSET * 2
      const minHorizontalSpaceNeeded = floatingBox.width + FLOATING_OFFSET * 2

      // Target nearly fills viewport only when there's insufficient space in ALL directions
      // This allows full-width elements to still have floating popovers above/below them
      const hasVerticalSpace =
        spaceAbove >= minVerticalSpaceNeeded ||
        spaceBelow >= minVerticalSpaceNeeded
      const hasHorizontalSpace =
        spaceLeft >= minHorizontalSpaceNeeded ||
        spaceRight >= minHorizontalSpaceNeeded

      const targetNearlyFillsViewport =
        !target.isScreen && !hasVerticalSpace && !hasHorizontalSpace

      const shouldDock =
        intersectsViewport &&
        (targetNearlyFillsViewport || maxOverflow > overflowThreshold)

      if (shouldDock) {
        if (!targetNearlyFillsViewport && retryState.attempts < 2) {
          retryState.attempts += 1
          clearRetryTimeout()
          overflowRetryTimeoutRef.current = window.setTimeout(() => {
            overflowRetryTimeoutRef.current = null
            if (cancelState.cancelled) return
            void updatePosition()
          }, 120)
          return
        }
        retryState.attempts = 0
        if (layoutMode !== 'docked') {
          setLayoutMode('docked')
          setFloatingPosition(dockedPosition)
        }
        return
      }

      retryState.attempts = 0
      if (layoutMode !== 'floating') {
        setLayoutMode('floating')
      }

      setFloatingPosition({
        top: y,
        left: x,
        transform: 'translate3d(0px, 0px, 0px)',
      })
    }

    void updatePosition()

    return () => {
      cancelState.cancelled = true
      clearRetryTimeout()
    }
  }, [
    autoAlignment,
    dockedPosition,
    isAutoPlacement,
    layoutMode,
    liveTargetUsable,
    offset,
    resolvedIsScreen,
    resolvedPlacement,
    target.element,
    target.isScreen,
    target.lastResolvedRect,
    target.lastUpdated,
    target.status,
    target.stepId,
  ])

  useLayoutEffect(() => {
    if (layoutMode !== 'manual' || !dragPosition) return
    setFloatingPosition({
      top: dragPosition.top,
      left: dragPosition.left,
      transform: 'translate3d(0px, 0px, 0px)',
    })
  }, [dragPosition, layoutMode])

  const clampToViewport = (rawLeft: number, rawTop: number) => {
    const rect = getViewportRect()
    const floatingEl = floatingRef.current
    const floatingElWidth = floatingEl?.offsetWidth ?? 0
    const floatingElHeight = floatingEl?.offsetHeight ?? 0
    const minLeft = rect.left + FLOATING_OFFSET
    const maxLeft = rect.left + rect.width - floatingElWidth - FLOATING_OFFSET
    const minTop = rect.top + FLOATING_OFFSET
    const maxTop = rect.top + rect.height - floatingElHeight - FLOATING_OFFSET
    return {
      left: Math.min(Math.max(rawLeft, minLeft), Math.max(minLeft, maxLeft)),
      top: Math.min(Math.max(rawTop, minTop), Math.max(minTop, maxTop)),
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    if (event.pointerId !== dragState.pointerId) return
    const rawLeft = event.clientX - dragState.offsetX
    const rawTop = event.clientY - dragState.offsetY
    const next = clampToViewport(rawLeft, rawTop)
    setLayoutMode('manual')
    setDragPosition(next)
  }

  const handlePointerEnd = (event: PointerEvent) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    if (event.pointerId !== dragState.pointerId) return
    endDrag()
  }

  const endDrag = () => {
    const dragState = dragStateRef.current
    if (!dragState) return
    const floatingEl = floatingRef.current
    if (floatingEl) {
      const supportsRelease =
        typeof floatingEl.releasePointerCapture === 'function'
      const supportsHasCapture =
        typeof floatingEl.hasPointerCapture === 'function'
      const hasCapture = supportsHasCapture
        ? floatingEl.hasPointerCapture(dragState.pointerId)
        : false
      if (supportsRelease && hasCapture) {
        try {
          floatingEl.releasePointerCapture(dragState.pointerId)
        } catch {
          // Ignore browsers without pointer capture support.
        }
      }
    }
    dragStateRef.current = null
    setIsDragging(false)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', handlePointerEnd)
    window.removeEventListener('pointercancel', handlePointerEnd)
  }

  const startDrag: PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.button !== 0) return
    const floatingEl = floatingRef.current
    if (!floatingEl) return
    const rect = floatingEl.getBoundingClientRect()
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    const next = clampToViewport(rect.left, rect.top)
    setLayoutMode('manual')
    setDragPosition(next)
    setIsDragging(true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
    const supportsPointerCapture =
      typeof floatingEl.setPointerCapture === 'function'
    if (supportsPointerCapture) {
      try {
        floatingEl.setPointerCapture(event.pointerId)
      } catch {
        // Ignore browsers without pointer capture support.
      }
    }
    event.preventDefault()
  }

  useEffect(() => endDrag, [])

  const shouldUseFallbackInitial =
    layoutMode !== 'mobile' &&
    (Boolean(target.lastResolvedRect) || Boolean(cachedTarget))

  const floatingCacheKey =
    layoutMode === 'mobile' ? null : getFloatingCacheKey(target)
  const persistedFloatingInitial =
    floatingCacheKey && floatingPositionCache.has(floatingCacheKey)
      ? (floatingPositionCache.get(floatingCacheKey) ?? null)
      : null
  const cachedFloatingInitial =
    layoutMode === 'mobile'
      ? null
      : (cachedFloatingPositionRef.current ?? persistedFloatingInitial)
  const hasCachedFloatingInitial = Boolean(cachedFloatingInitial)

  const resolvedInitialPosition: FloatingPositionState =
    layoutMode === 'mobile'
      ? mobilePosition
      : hasCachedFloatingInitial && cachedFloatingInitial
        ? cachedFloatingInitial
        : shouldUseFallbackInitial
          ? fallbackPosition
          : centerInitialPosition

  const initialTop = resolvedInitialPosition.top
  const initialLeft = resolvedInitialPosition.left
  const initialTransform = resolvedInitialPosition.transform

  const hasPersistableAnchor =
    Boolean(cachedTarget) ||
    Boolean(target.lastResolvedRect) ||
    Boolean(target.rect) ||
    Boolean(cachedFloatingPositionRef.current) ||
    Boolean(lastStableAnchorRef.current)

  const shouldPersistWhileResolving =
    !hasAnchor &&
    target.stepId !== null &&
    target.status !== 'idle' &&
    hasPersistableAnchor

  const containerStyle: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'auto',
    zIndex,
    maxWidth:
      layoutMode === 'mobile' || typeof maxWidth === 'undefined'
        ? undefined
        : maxWidth,
    width:
      layoutMode === 'mobile' || typeof width === 'undefined'
        ? undefined
        : width,
    cursor: isDragging ? 'grabbing' : undefined,
  }

  const setFloatingNode: RefCallback<HTMLElement> = (node) => {
    floatingRef.current = node
    onContainerChange?.(node as HTMLDivElement | null)
  }

  const containerProps = {
    ref: setFloatingNode,
    role: role ?? 'dialog',
    'aria-modal': ariaModal ?? false,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    tabIndex: -1,
    'aria-live': 'polite',
    'data-tour-popover': '',
    'data-layout': layoutMode,
    'data-target-visibility': target.visibility,
    'data-rect-source': target.rectSource,
    style: containerStyle,
    initial: {
      filter: 'blur(4px)',
      opacity: 0,
      top: initialTop,
      left: initialLeft,
      transform: initialTransform,
    },
    animate: {
      filter: 'blur(0px)',
      opacity: 1,
      top: floatingPosition.top,
      left: floatingPosition.left,
      transform: floatingPosition.transform,
    },
    exit: {
      filter: 'blur(4px)',
      opacity: 0,
      transition: popoverExitTransition,
    },
    transition: popoverEntranceTransition,
    ...(layoutId ? { layoutId } : {}),
  } satisfies TourPopoverPortalRenderProps['containerProps']

  const contentKeyCommitTimeoutRef = useRef<number | null>(null)
  const [displayedStepKey, setDisplayedStepKey] = useState<string | null>(
    target.stepId ?? null,
  )

  useEffect(() => {
    return () => {
      if (contentKeyCommitTimeoutRef.current !== null) {
        window.clearTimeout(contentKeyCommitTimeoutRef.current)
        contentKeyCommitTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const nextStepKey = target.stepId ?? null
    if (nextStepKey === null) {
      if (contentKeyCommitTimeoutRef.current !== null) {
        window.clearTimeout(contentKeyCommitTimeoutRef.current)
        contentKeyCommitTimeoutRef.current = null
      }
      setDisplayedStepKey(null)
      return
    }
    if (displayedStepKey === nextStepKey) return
    if (contentKeyCommitTimeoutRef.current !== null) {
      window.clearTimeout(contentKeyCommitTimeoutRef.current)
      contentKeyCommitTimeoutRef.current = null
    }
    if (displayedStepKey === null) {
      setDisplayedStepKey(nextStepKey)
      return
    }
    if (!hasLiveStableAnchor) return
    contentKeyCommitTimeoutRef.current = window.setTimeout(() => {
      setDisplayedStepKey(nextStepKey)
      contentKeyCommitTimeoutRef.current = null
    }, 120)
  }, [displayedStepKey, hasLiveStableAnchor, target.stepId])

  useEffect(() => {
    if (displayedStepKey !== null) return
    if (target.stepId === null) return
    if (hasAnchor) {
      setDisplayedStepKey(target.stepId)
    }
  }, [displayedStepKey, hasAnchor, target.stepId])

  const contentKey =
    target.stepId === null ? undefined : (displayedStepKey ?? target.stepId)

  const contentProps = {
    key: contentKey ?? undefined,
    'data-tour-popover-content': '',
    initial: { opacity: 0, translateX: 0, filter: 'blur(4px)' },
    animate: { opacity: 1, translateX: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, translateX: 0, filter: 'blur(4px)' },
    transition: popoverContentTransition,
  } satisfies TourPopoverPortalRenderProps['contentProps']

  const showDragHandle = layoutMode === 'docked' || layoutMode === 'manual'
  const dragHandleProps: TourPopoverPortalRenderProps['dragHandleProps'] = {
    type: 'button',
    'aria-label': 'Move tour popover',
    style: { touchAction: 'none' },
    onPointerDown: startDrag,
  }

  const descriptionProps = {
    id: descriptionId,
    text: descriptionText,
  }

  const context: TourPopoverPortalRenderProps = {
    Container,
    Content,
    containerProps,
    contentProps,
    layoutMode,
    isDragging,
    showDragHandle,
    dragHandleProps,
    descriptionProps,
  }

  // Keep the last rendered position during resolving transitions (e.g. long scroll between steps)
  // to avoid brief unmount/remount flashes when rect data is temporarily unavailable.
  if (shouldHidePopover && !shouldPersistWhileResolving) return null

  return createPortal(children(context), host)
}
