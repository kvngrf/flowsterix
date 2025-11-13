import type { PointerEventHandler, ReactNode } from 'react'
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
const DOCKED_MARGIN = 24
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
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaModal?: boolean
  descriptionId?: string
  descriptionText?: string
  onContainerChange?: (node: HTMLDivElement | null) => void
}

export const TourPopover = ({
  target,
  children,
  offset = 16,
  maxWidth = 360,
  zIndex = 1001,
  className,
  placement,
  role,
  ariaLabel,
  ariaDescribedBy,
  ariaModal,
  descriptionId,
  descriptionText,
  onContainerChange,
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
  const [layoutMode, setLayoutMode] = useState<
    'floating' | 'docked' | 'manual'
  >('floating')
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
  const baseClass = cn('fixed w-max pointer-events-auto', className)

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
    if (!onContainerChange) return
    onContainerChange(floatingRef.current)
    return () => {
      onContainerChange(null)
    }
  }, [onContainerChange])

  useLayoutEffect(() => {
    if (layoutMode !== 'floating') return
    setFloatingPosition(fallbackPosition)
  }, [fallbackPosition, layoutMode])

  const dockedPosition = useMemo(
    () => ({
      top: viewport.height - DOCKED_MARGIN,
      left: viewport.width - DOCKED_MARGIN,
      transform: 'translate3d(-100%, -100%, 0px)',
    }),
    [viewport.height, viewport.width],
  )

  useEffect(() => {
    if (layoutMode === 'docked') {
      setFloatingPosition(dockedPosition)
    }
  }, [dockedPosition, layoutMode])

  useEffect(() => {
    setDragPosition(null)
    setLayoutMode('floating')
  }, [target.stepId])

  useEffect(() => {
    if (layoutMode !== 'manual') {
      setDragPosition(null)
    }
  }, [layoutMode])

  useLayoutEffect(() => {
    if (!isBrowser) return
    const floatingEl = floatingRef.current
    const rectInfo = target.rect
    if (!floatingEl) return
    if (target.status !== 'ready') return
    if (!rectInfo || target.isScreen) return
    if (layoutMode !== 'floating') return

    const cancelState = { cancelled: false }

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

      if (cancelState.cancelled) return

      const floatingRect = floatingEl.getBoundingClientRect()
      const viewportRect = getViewportRect()
      const overflowLeft = Math.max(0, viewportRect.left + FLOATING_OFFSET - x)
      const overflowRight = Math.max(
        0,
        x +
          floatingRect.width +
          FLOATING_OFFSET -
          (viewportRect.left + viewportRect.width),
      )
      const overflowTop = Math.max(0, viewportRect.top + FLOATING_OFFSET - y)
      const overflowBottom = Math.max(
        0,
        y +
          floatingRect.height +
          FLOATING_OFFSET -
          (viewportRect.top + viewportRect.height),
      )

      const maxOverflow = Math.max(
        overflowTop,
        overflowRight,
        overflowBottom,
        overflowLeft,
      )

      if (maxOverflow > 4) {
        setLayoutMode('docked')
        setFloatingPosition(dockedPosition)
        return
      }

      setLayoutMode('floating')

      setFloatingPosition({
        top: y,
        left: x,
        transform: 'translate3d(0px, 0px, 0px)',
      })
    }

    void updatePosition()

    return () => {
      cancelState.cancelled = true
    }
  }, [
    autoAlignment,
    dockedPosition,
    isAutoPlacement,
    layoutMode,
    offset,
    target.element,
    target.isScreen,
    target.lastUpdated,
    target.status,
    resolvedPlacement,
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
    const width = floatingEl?.offsetWidth ?? 0
    const height = floatingEl?.offsetHeight ?? 0
    const minLeft = rect.left + FLOATING_OFFSET
    const maxLeft = rect.left + rect.width - width - FLOATING_OFFSET
    const minTop = rect.top + FLOATING_OFFSET
    const maxTop = rect.top + rect.height - height - FLOATING_OFFSET
    return {
      left: Math.min(Math.max(rawLeft, minLeft), Math.max(minLeft, maxLeft)),
      top: Math.min(Math.max(rawTop, minTop), Math.max(minTop, maxTop)),
    }
  }

  const endDrag = () => {
    const dragState = dragStateRef.current
    if (!dragState) return
    const floatingEl = floatingRef.current
    if (floatingEl && floatingEl.hasPointerCapture(dragState.pointerId)) {
      try {
        floatingEl.releasePointerCapture(dragState.pointerId)
      } catch {
        // Ignore browsers without pointer capture support.
      }
    }
    dragStateRef.current = null
    setIsDragging(false)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', handlePointerEnd)
    window.removeEventListener('pointercancel', handlePointerEnd)
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
    try {
      floatingEl.setPointerCapture(event.pointerId)
    } catch {
      // Ignore browsers that do not support pointer capture.
    }
    event.preventDefault()
  }

  useEffect(() => endDrag, [])

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
      className={cn(
        baseClass,
        'overflow-hidden',
        layoutMode === 'docked' ? 'tour-popover--docked' : null,
        layoutMode === 'manual' ? 'tour-popover--manual' : null,
      )}
      role={role ?? 'dialog'}
      aria-modal={ariaModal ?? false}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={-1}
      data-tour-popover=""
      data-layout={layoutMode}
      style={{
        zIndex,
        maxWidth,
        cursor: isDragging ? 'grabbing' : undefined,
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
      aria-live="polite"
    >
      {descriptionText && descriptionId ? (
        <span id={descriptionId} className="sr-only">
          {descriptionText}
        </span>
      ) : null}
      <div className="relative" data-tour-popover-shell="">
        {layoutMode === 'docked' || layoutMode === 'manual' ? (
          <button
            type="button"
            className={cn(
              'group absolute z-10 -right-3 -top-3 flex h-8 w-8 select-none items-center justify-center rounded-full bg-transparent transition-colors',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
              'hover:bg-slate-100/40',
            )}
            onPointerDown={startDrag}
            aria-label="Move tour popover"
            style={{ touchAction: 'none' }}
            data-tour-popover-handle=""
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'h-4 w-4 text-slate-400 transition-colors',
                isDragging ? 'text-slate-400' : 'group-hover:text-slate-400/90',
              )}
            >
              <path d="M12 2v20" />
              <path d="m15 19-3 3-3-3" />
              <path d="m19 9 3 3-3 3" />
              <path d="M2 12h20" />
              <path d="m5 9-3 3 3 3" />
              <path d="m9 5 3-3 3 3" />
            </svg>
          </button>
        ) : null}
        <AnimatePresence mode="popLayout">
          <MotionDiv
            key={target.stepId}
            data-tour-popover-content=""
            initial={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, translateX: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
            transition={popoverContentTransition}
          >
            {children}
          </MotionDiv>
        </AnimatePresence>
      </div>
    </MotionDiv>,
    host,
  )
}
