import type { ReactNode } from 'react'
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
import type { StepPlacement } from '@tour/core'
import type { Transition } from 'motion/react'
import { AnimatePresence } from 'motion/react'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { useAnimationAdapter } from '../motion/animationAdapter'
import { cn } from '../utils/cn'
import type { ClientRectLike } from '../utils/dom'
import { getViewportRect, isBrowser, portalHost } from '../utils/dom'

const FLOATING_OFFSET = 8
const DEFAULT_POPOVER_ENTRANCE_TRANSITION: Transition = {
  duration: 0.25,
  ease: 'easeOut',
}
const DEFAULT_POPOVER_EXIT_TRANSITION: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}
const DEFAULT_POPOVER_CONTENT_TRANSITION: Transition = {
  duration: 0.6,
  ease: 'easeOut',
}
export interface TourPopoverProps {
  target: TourTargetInfo
  children: ReactNode
  offset?: number
  maxWidth?: number
  zIndex?: number
  className?: string
  placement?: StepPlacement
}

export const TourPopover = ({
  target,
  children,
  offset = 16,
  maxWidth = 360,
  zIndex = 1001,
  className,
  placement,
}: TourPopoverProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null
  const adapter = useAnimationAdapter()

  const viewport = getViewportRect()
  const lastReadyTargetRef = useRef<{
    rect: ClientRectLike
    isScreen: boolean
  } | null>(null)

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
    if (target.status === 'ready' && target.rect) {
      lastReadyTargetRef.current = {
        rect: { ...target.rect },
        isScreen: target.isScreen,
      }
    } else if (target.status === 'idle') {
      lastReadyTargetRef.current = null
    }
  }, [target.isScreen, target.rect, target.status])

  const cachedTarget = lastReadyTargetRef.current

  const resolvedRect =
    target.rect ?? target.lastResolvedRect ?? cachedTarget?.rect ?? null
  const resolvedIsScreen =
    target.status === 'ready'
      ? target.isScreen
      : (cachedTarget?.isScreen ?? target.isScreen)

  const fallbackRect = resolvedRect ?? viewport
  const fallbackIsScreen = resolvedIsScreen

  const baseTop = fallbackIsScreen
    ? viewport.height / 2
    : fallbackRect.top + fallbackRect.height + offset
  const top = fallbackIsScreen
    ? viewport.height / 2
    : Math.min(viewport.height - 24, Math.max(24, baseTop))
  const left = fallbackIsScreen
    ? viewport.width / 2
    : fallbackRect.left + fallbackRect.width / 2
  const fallbackTransform = fallbackIsScreen
    ? 'translate3d(-50%, -50%, 0px)'
    : 'translate3d(-50%, 0%, 0px)'
  const baseClass = cn(
    'fixed w-max pointer-events-auto rounded-xl bg-white px-6 py-5 text-slate-900 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.35)]',
    className,
  )

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

  const floatingRef = useRef<HTMLDivElement | null>(null)
  const [floatingPosition, setFloatingPosition] = useState(fallbackPosition)

  useLayoutEffect(() => {
    setFloatingPosition(fallbackPosition)
  }, [fallbackPosition])

  useLayoutEffect(() => {
    if (!isBrowser) return
    const floatingEl = floatingRef.current
    const rectInfo = target.rect
    if (!floatingEl) return
    if (target.status !== 'ready') return
    if (!rectInfo || target.isScreen) return

    let cancelled = false

    const virtualReference: VirtualElement = {
      contextElement: target.element ?? undefined,
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
        : [flip({ padding: FLOATING_OFFSET })]),
      shift({ padding: FLOATING_OFFSET }),
    ]

    const updatePosition = async () => {
      const { x, y } = await computePosition(virtualReference, floatingEl, {
        placement: computePlacement,
        strategy: 'fixed',
        middleware,
      })

      if (cancelled) return
      setFloatingPosition({
        top: y,
        left: x,
        transform: 'translate3d(0px, 0px, 0px)',
      })
    }

    void updatePosition()

    return () => {
      cancelled = true
    }
  }, [
    autoAlignment,
    isAutoPlacement,
    offset,
    target.element,
    target.isScreen,
    target.lastUpdated,
    target.status,
    resolvedPlacement,
  ])

  const shouldUseFallbackInitial =
    Boolean(target.lastResolvedRect) || Boolean(cachedTarget)

  const { MotionDiv } = adapter.components
  const popoverEntranceTransition =
    adapter.transitions.popoverEntrance ?? DEFAULT_POPOVER_ENTRANCE_TRANSITION
  const popoverExitTransition =
    adapter.transitions.popoverExit ?? DEFAULT_POPOVER_EXIT_TRANSITION
  const popoverContentTransition =
    adapter.transitions.popoverContent ?? DEFAULT_POPOVER_CONTENT_TRANSITION

  return createPortal(
    <MotionDiv
      ref={floatingRef}
      transition={popoverEntranceTransition}
      className={cn(baseClass, 'overflow-hidden')}
      style={{
        zIndex,
        maxWidth,
      }}
      initial={{
        filter: 'blur(4px)',
        opacity: 0,
        top: shouldUseFallbackInitial
          ? fallbackPosition.top
          : centerInitialPosition.top,
        left: shouldUseFallbackInitial
          ? fallbackPosition.left
          : centerInitialPosition.left,
        transform: shouldUseFallbackInitial
          ? fallbackPosition.transform
          : centerInitialPosition.transform,
      }}
      animate={{
        filter: 'blur(0px)',
        opacity: 1,
        top: floatingPosition.top,
        left: floatingPosition.left,
        transform: floatingPosition.transform,
      }}
      exit={{
        filter: 'blur(4px)',
        opacity: 0,
        transition: popoverExitTransition,
      }}
      role="dialog"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        <MotionDiv
          key={target.stepId}
          initial={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, translateX: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
          transition={popoverContentTransition}
        >
          {children}
        </MotionDiv>
      </AnimatePresence>
    </MotionDiv>,
    host,
  )
}
