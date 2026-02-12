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
const STEP_TRANSITION_OVERSIZED_VIEWPORT_COVERAGE_THRESHOLD = 0.9
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

const POSITION_EPSILON = 0.5

const summarizeRect = (rect: ClientRectLike | null) => {
  if (!rect) return null
  return {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

const summarizePosition = (position: FloatingPositionState) => ({
  top: Math.round(position.top),
  left: Math.round(position.left),
  transform: position.transform,
})

const positionsDiffer = (
  previous: FloatingPositionState,
  next: FloatingPositionState,
  epsilon = POSITION_EPSILON,
) =>
  Math.abs(previous.top - next.top) > epsilon ||
  Math.abs(previous.left - next.left) > epsilon ||
  previous.transform !== next.transform

const isPopoverDebugEnabled = () => {
  if (!isBrowser) return false
  const w = window as unknown as Record<string, unknown>
  if (w.__FLOWSTERIX_DEBUG_POPOVER__ === true) return true
  try {
    return window.localStorage.getItem('flowsterix:debug:popover') === '1'
  } catch {
    return false
  }
}

const logPopoverDebug = (event: string, payload: Record<string, unknown>) => {
  if (!isPopoverDebugEnabled()) return
  if (typeof console === 'undefined') return
  if (typeof console.debug !== 'function') return
  console.debug(`[tour][popover] ${event}`, payload)
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

export const resolveLayoutModeForStep = (
  current: TourPopoverLayoutMode,
  options: {
    prefersMobile: boolean
    isScreenTarget: boolean
  },
): TourPopoverLayoutMode => {
  if (options.prefersMobile) return 'mobile'
  if (options.isScreenTarget) return 'floating'
  if (current === 'manual' || current === 'mobile') return 'floating'
  return current
}

export const shouldApplyFloatingCacheForTarget = (options: {
  targetStatus: TourTargetInfo['status']
  liveTargetUsable: boolean
}) => options.targetStatus === 'ready' && options.liveTargetUsable

export const shouldPersistFloatingCacheForTarget = (options: {
  targetStatus: TourTargetInfo['status']
  liveTargetUsable: boolean
}) => options.targetStatus === 'ready' && options.liveTargetUsable

export const shouldAttemptPopoverPositioning = (options: {
  targetStatus: TourTargetInfo['status']
  hasReferenceRect: boolean
  resolvedIsScreen: boolean
  layoutMode: TourPopoverLayoutMode
  isTransitioningBetweenSteps: boolean
  liveTargetUsable: boolean
}) =>
  options.targetStatus === 'ready' &&
  options.hasReferenceRect &&
  !options.resolvedIsScreen &&
  (!options.isTransitioningBetweenSteps || options.liveTargetUsable) &&
  options.layoutMode !== 'mobile' &&
  options.layoutMode !== 'manual'

export const shouldDisableSharedPopoverLayoutForHandoff = (options: {
  isTransitioningBetweenSteps: boolean
  liveTargetUsable: boolean
}) => options.isTransitioningBetweenSteps && !options.liveTargetUsable

export const shouldClearDisplayedStepKey = (options: {
  nextStepId: string | null
  hasAnchor: boolean
  shouldPersistWhileResolving: boolean
}) =>
  options.nextStepId === null &&
  !options.hasAnchor &&
  !options.shouldPersistWhileResolving

export const resolveDisplayedPopoverContentKey = (options: {
  displayedStepKey: string | null
  targetStepId: string | null
}) => options.displayedStepKey ?? options.targetStepId ?? undefined

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

  const promotedTarget = liveTargetUsable && target.rect
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
  const prefersMobileRef = useRef(prefersMobileLayout)
  useEffect(() => {
    prefersMobileRef.current = prefersMobileLayout
  }, [prefersMobileLayout])

  useEffect(() => {
    if (target.status === 'idle' && !isInGracePeriod) {
      // Only clear when truly idle, not during step transitions.
      lastReadyTargetRef.current = null
    }
  }, [isInGracePeriod, target.status])

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
  const [sharedLayoutDisabledForStep, setSharedLayoutDisabledForStep] =
    useState(false)
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
  const lastHandoffSignatureRef = useRef<string | null>(null)
  const lastPositionSkipSignatureRef = useRef<string | null>(null)
  const lastDomDriftSignatureRef = useRef<string | null>(null)
  const sharedLayoutDisableReasonRef = useRef<string | null>(null)

  const setLayoutModeWithDebug = (
    nextLayoutMode: TourPopoverLayoutMode,
    reason: string,
    extra: Record<string, unknown> = {},
  ) => {
    setLayoutMode((current) => {
      if (current === nextLayoutMode) return current
      logPopoverDebug('layout-mode-write', {
        stepId: target.stepId,
        from: current,
        to: nextLayoutMode,
        reason,
        ...extra,
      })
      return nextLayoutMode
    })
  }

  const setFloatingPositionWithDebug = (
    nextPosition: FloatingPositionState,
    reason: string,
    extra: Record<string, unknown> = {},
  ) => {
    setFloatingPosition((previous) => {
      if (!positionsDiffer(previous, nextPosition)) return previous
      logPopoverDebug('position-write', {
        stepId: target.stepId,
        reason,
        from: summarizePosition(previous),
        to: summarizePosition(nextPosition),
        layoutMode,
        ...extra,
      })
      return nextPosition
    })
  }

  useEffect(() => {
    const handoffSignature = [
      target.stepId ?? 'null',
      target.status,
      isTransitioningBetweenSteps ? '1' : '0',
      liveTargetUsable ? '1' : '0',
      incomingRectSettled ? '1' : '0',
      requiresSettleBeforePromote ? '1' : '0',
      resolvedIsScreen ? '1' : '0',
      hasAnchor ? '1' : '0',
      cachedTarget?.stepId ?? 'null',
    ].join('|')
    if (lastHandoffSignatureRef.current === handoffSignature) return
    lastHandoffSignatureRef.current = handoffSignature
    logPopoverDebug('handoff-state', {
      stepId: target.stepId,
      status: target.status,
      rectSource: target.rectSource,
      isTransitioningBetweenSteps,
      liveTargetUsable,
      incomingRectSettled,
      requiresSettleBeforePromote,
      settleRemainingMs: Math.round(settleRemainingMs),
      resolvedIsScreen,
      hasAnchor,
      resolvedRect: summarizeRect(resolvedRect),
      cachedStepId: cachedTarget?.stepId ?? null,
      cachedRect: summarizeRect(cachedTarget?.rect ?? null),
      requestedLayoutId: layoutId ?? null,
      effectiveLayoutId: sharedLayoutDisabledForStep
        ? null
        : (layoutId ?? null),
      sharedLayoutDisabledForStep,
      sharedLayoutDisableReason: sharedLayoutDisableReasonRef.current,
    })
  }, [
    cachedTarget?.rect,
    cachedTarget?.stepId,
    hasAnchor,
    incomingRectSettled,
    isTransitioningBetweenSteps,
    liveTargetUsable,
    requiresSettleBeforePromote,
    resolvedIsScreen,
    resolvedRect,
    sharedLayoutDisabledForStep,
    settleRemainingMs,
    layoutId,
    target.rectSource,
    target.status,
    target.stepId,
  ])

  const persistFloatingCache = (
    position: FloatingPositionState,
    reason: string,
  ) => {
    const cacheKey = getFloatingCacheKey(target)
    if (!cacheKey) return
    if (
      !shouldPersistFloatingCacheForTarget({
        targetStatus: target.status,
        liveTargetUsable,
      })
    ) {
      logPopoverDebug('cache-persist-skipped', {
        stepId: target.stepId,
        status: target.status,
        liveTargetUsable,
        reason,
      })
      return
    }
    floatingPositionCache.set(cacheKey, position)
    logPopoverDebug('cache-persisted', {
      stepId: target.stepId,
      status: target.status,
      liveTargetUsable,
      reason,
      position: {
        top: Math.round(position.top),
        left: Math.round(position.left),
      },
    })
  }

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
      const next = resolveLayoutModeForStep(current, {
        prefersMobile: prefersMobileRef.current,
        isScreenTarget: target.isScreen,
      })
      if (next !== current) {
        logPopoverDebug('layout-mode-write', {
          stepId: target.stepId,
          from: current,
          to: next,
          reason: 'step-change-reset',
          isScreenTarget: target.isScreen,
          prefersMobile: prefersMobileRef.current,
        })
      }
      return next
    })
    setSharedLayoutDisabledForStep(false)
    sharedLayoutDisableReasonRef.current = null
    appliedFloatingCacheRef.current = null
  }, [target.isScreen, target.stepId])

  useEffect(() => {
    const shouldDisableSharedLayout = shouldDisableSharedPopoverLayoutForHandoff(
      {
        isTransitioningBetweenSteps,
        liveTargetUsable,
      },
    )
    if (!shouldDisableSharedLayout) return
    if (sharedLayoutDisabledForStep) return
    setSharedLayoutDisabledForStep(true)
    sharedLayoutDisableReasonRef.current = 'handoff-freeze'
    logPopoverDebug('shared-layout-disabled', {
      stepId: target.stepId,
      reason: 'handoff-freeze',
      isTransitioningBetweenSteps,
      liveTargetUsable,
    })
  }, [
    isTransitioningBetweenSteps,
    liveTargetUsable,
    sharedLayoutDisabledForStep,
    target.stepId,
  ])

  useEffect(() => {
    if (layoutMode !== 'manual') {
      setDragPosition(null)
    }
  }, [layoutMode])

  useEffect(() => {
    cachedFloatingPositionRef.current = floatingPosition
  }, [floatingPosition])

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
      setFloatingPositionWithDebug(dockedPosition, 'layout-docked-sync')
    }
  }, [dockedPosition, layoutMode])

  // Report popover height for scroll lock bottom inset
  useEffect(() => {
    if (!onHeightChange) return
    onHeightChange(floatingSize ? floatingSize.height + DOCKED_MARGIN : 0)
  }, [floatingSize, onHeightChange])

  useEffect(() => {
    if (layoutMode === 'mobile') {
      setFloatingPositionWithDebug(mobilePosition, 'layout-mobile-sync')
    }
  }, [layoutMode, mobilePosition])

  useEffect(() => {
    if (prefersMobileLayout) {
      if (layoutMode !== 'mobile') {
        setLayoutModeWithDebug('mobile', 'prefers-mobile-layout')
        setDragPosition(null)
      }
      return
    }
    if (layoutMode === 'mobile') {
      setLayoutModeWithDebug('floating', 'mobile-layout-disabled')
      setFloatingPositionWithDebug(fallbackPosition, 'mobile-exit-fallback')
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
      if (
        !shouldApplyFloatingCacheForTarget({
          targetStatus: target.status,
          liveTargetUsable,
        })
      ) {
        logPopoverDebug('cache-deferred', {
          stepId,
          status: target.status,
          liveTargetUsable,
        })
        return
      }
      if (hasAnchor) {
        appliedFloatingCacheRef.current = stepId
        logPopoverDebug('cache-skipped-has-anchor', {
          stepId,
          status: target.status,
          liveTargetUsable,
        })
        return
      }
      appliedFloatingCacheRef.current = stepId
      setFloatingPositionWithDebug(cached, 'cache-applied')
      logPopoverDebug('cache-applied', {
        stepId,
        position: {
          top: Math.round(cached.top),
          left: Math.round(cached.left),
        },
      })
      return
    }
    appliedFloatingCacheRef.current = stepId
    if ((target.status !== 'ready' || target.isScreen) && hasAnchor) {
      setFloatingPositionWithDebug(
        fallbackPosition,
        'fallback-position-applied',
      )
      logPopoverDebug('fallback-position-applied', {
        stepId,
        status: target.status,
        isScreen: target.isScreen,
        fallbackPosition: {
          top: Math.round(fallbackPosition.top),
          left: Math.round(fallbackPosition.left),
        },
      })
    }
  }, [
    fallbackPosition,
    hasAnchor,
    layoutMode,
    liveTargetUsable,
    target.isScreen,
    target.status,
    target.stepId,
  ])

  const resolvedLayoutId = sharedLayoutDisabledForStep ? undefined : layoutId

  const shouldDeferScreenSnap =
    layoutMode === 'floating' && target.isScreen && Boolean(resolvedLayoutId)

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
    setFloatingPositionWithDebug(fallbackPosition, 'screen-fallback-immediate')
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
        setFloatingPositionWithDebug(
          fallbackPosition,
          'screen-fallback-deferred',
        )
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
    const rectInfo = target.status === 'ready' ? (resolvedRect ?? null) : null
    if (!floatingEl) return
    const canAttemptPositioning = shouldAttemptPopoverPositioning({
      targetStatus: target.status,
      hasReferenceRect: Boolean(rectInfo),
      resolvedIsScreen,
      layoutMode,
      isTransitioningBetweenSteps,
      liveTargetUsable,
    })
    if (!canAttemptPositioning) {
      const skipReason =
        target.status !== 'ready'
          ? 'target-not-ready'
          : !rectInfo
            ? 'missing-reference-rect'
            : resolvedIsScreen
              ? 'screen-target'
              : layoutMode === 'mobile'
                ? 'mobile-layout'
                : layoutMode === 'manual'
                  ? 'manual-layout'
                  : isTransitioningBetweenSteps && !liveTargetUsable
                    ? 'handoff-freeze'
                    : 'unknown'
      const skipSignature = [
        target.stepId ?? 'null',
        skipReason,
        target.status,
        layoutMode,
        liveTargetUsable ? '1' : '0',
        isTransitioningBetweenSteps ? '1' : '0',
      ].join('|')
      if (lastPositionSkipSignatureRef.current !== skipSignature) {
        lastPositionSkipSignatureRef.current = skipSignature
        logPopoverDebug('positioning-skipped', {
          stepId: target.stepId,
          status: target.status,
          hasReferenceRect: Boolean(rectInfo),
          resolvedIsScreen,
          layoutMode,
          isTransitioningBetweenSteps,
          liveTargetUsable,
          reason: skipReason,
          frozenPosition: summarizePosition(floatingPosition),
          resolvedRect: summarizeRect(rectInfo),
        })
      }
      return
    }
    lastPositionSkipSignatureRef.current = null
    if (!rectInfo) return

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
        persistFloatingCache(dockedPosition, 'docked')
        if (layoutMode !== 'docked') {
          setLayoutModeWithDebug('docked', 'auto-dock', {
            targetNearlyFillsViewport,
            maxOverflow: Math.round(maxOverflow),
            overflowThreshold: Math.round(overflowThreshold),
          })
          setFloatingPositionWithDebug(dockedPosition, 'auto-dock')
          logPopoverDebug('docked', {
            stepId: target.stepId,
            reason: targetNearlyFillsViewport
              ? 'target-nearly-fills-viewport'
              : 'overflow-threshold',
            position: {
              top: Math.round(dockedPosition.top),
              left: Math.round(dockedPosition.left),
            },
          })
        }
        return
      }

      retryState.attempts = 0
      if (layoutMode !== 'floating') {
        setLayoutModeWithDebug('floating', 'floating-placement')
      }

      const nextPosition: FloatingPositionState = {
        top: y,
        left: x,
        transform: 'translate3d(0px, 0px, 0px)',
      }
      persistFloatingCache(nextPosition, 'floating')
      setFloatingPositionWithDebug(nextPosition, 'floating-placement', {
        rect: summarizeRect(rectInfo),
      })
      logPopoverDebug('position-updated', {
        stepId: target.stepId,
        x: Math.round(x),
        y: Math.round(y),
        rect: summarizeRect(rectInfo),
        layoutMode,
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
    floatingPosition.left,
    floatingPosition.top,
    floatingPosition.transform,
    isAutoPlacement,
    isTransitioningBetweenSteps,
    layoutMode,
    liveTargetUsable,
    offset,
    resolvedRect,
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
    const nextPosition: FloatingPositionState = {
      top: dragPosition.top,
      left: dragPosition.left,
      transform: 'translate3d(0px, 0px, 0px)',
    }
    persistFloatingCache(nextPosition, 'manual')
    setFloatingPositionWithDebug(nextPosition, 'manual-drag')
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
    setLayoutModeWithDebug('manual', 'drag-pointer-move')
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
    setLayoutModeWithDebug('manual', 'drag-start')
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

  useEffect(() => {
    logPopoverDebug('anchor-state', {
      stepId: target.stepId,
      status: target.status,
      visibility: target.visibility,
      rectSource: target.rectSource,
      liveTargetUsable,
      hasAnchor,
      resolvedIsScreen,
      resolvedRect: summarizeRect(resolvedRect),
      cachedStepId: cachedTarget?.stepId ?? null,
      cachedRect: summarizeRect(cachedTarget?.rect ?? null),
      floatingPosition: {
        top: Math.round(floatingPosition.top),
        left: Math.round(floatingPosition.left),
      },
      layoutMode,
      requestedLayoutId: layoutId ?? null,
      effectiveLayoutId: resolvedLayoutId ?? null,
      sharedLayoutDisabledForStep,
      sharedLayoutDisableReason: sharedLayoutDisableReasonRef.current,
    })
  }, [
    cachedTarget?.rect,
    cachedTarget?.stepId,
    floatingPosition.left,
    floatingPosition.top,
    hasAnchor,
    layoutMode,
    layoutId,
    liveTargetUsable,
    resolvedIsScreen,
    resolvedLayoutId,
    resolvedRect,
    sharedLayoutDisabledForStep,
    target.rectSource,
    target.status,
    target.stepId,
    target.visibility,
  ])

  useLayoutEffect(() => {
    const node = floatingRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const deltaTop = rect.top - floatingPosition.top
    const deltaLeft = rect.left - floatingPosition.left
    const driftSignature = [
      target.stepId ?? 'null',
      layoutMode,
      Math.round(deltaTop),
      Math.round(deltaLeft),
      isTransitioningBetweenSteps ? '1' : '0',
      liveTargetUsable ? '1' : '0',
    ].join('|')
    const hasDrift =
      Math.abs(deltaTop) > POSITION_EPSILON ||
      Math.abs(deltaLeft) > POSITION_EPSILON
    if (!hasDrift) {
      lastDomDriftSignatureRef.current = null
      return
    }
    if (lastDomDriftSignatureRef.current === driftSignature) return
    lastDomDriftSignatureRef.current = driftSignature
    if (layoutId && !sharedLayoutDisabledForStep) {
      setSharedLayoutDisabledForStep(true)
      sharedLayoutDisableReasonRef.current = 'dom-drift-detected'
      logPopoverDebug('shared-layout-disabled', {
        stepId: target.stepId,
        reason: 'dom-drift-detected',
        delta: {
          top: Math.round(deltaTop * 10) / 10,
          left: Math.round(deltaLeft * 10) / 10,
        },
      })
    }
    logPopoverDebug('dom-position-drift', {
      stepId: target.stepId,
      layoutMode,
      transitioning: isTransitioningBetweenSteps,
      liveTargetUsable,
      intended: summarizePosition(floatingPosition),
      rendered: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      },
      delta: {
        top: Math.round(deltaTop * 10) / 10,
        left: Math.round(deltaLeft * 10) / 10,
      },
      requestedLayoutId: layoutId ?? null,
      effectiveLayoutId: resolvedLayoutId ?? null,
      sharedLayoutDisabledForStep,
      sharedLayoutDisableReason: sharedLayoutDisableReasonRef.current,
    })
  }, [
    floatingPosition,
    isTransitioningBetweenSteps,
    layoutId,
    resolvedLayoutId,
    layoutMode,
    liveTargetUsable,
    sharedLayoutDisabledForStep,
    target.stepId,
  ])

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
    ...(resolvedLayoutId ? { layoutId: resolvedLayoutId } : {}),
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
      if (
        shouldClearDisplayedStepKey({
          nextStepId: null,
          hasAnchor,
          shouldPersistWhileResolving,
        })
      ) {
        setDisplayedStepKey(null)
      }
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
  }, [
    displayedStepKey,
    hasAnchor,
    hasLiveStableAnchor,
    shouldPersistWhileResolving,
    target.stepId,
  ])

  useEffect(() => {
    if (displayedStepKey !== null) return
    if (target.stepId === null) return
    if (hasAnchor) {
      setDisplayedStepKey(target.stepId)
    }
  }, [displayedStepKey, hasAnchor, target.stepId])

  const contentKey = resolveDisplayedPopoverContentKey({
    displayedStepKey,
    targetStepId: target.stepId ?? null,
  })

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
