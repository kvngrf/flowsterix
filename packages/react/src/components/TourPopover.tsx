import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { VirtualElement } from '@floating-ui/dom'
import {
  computePosition,
  flip,
  offset as floatingOffset,
  shift,
} from '@floating-ui/dom'
import { AnimatePresence, motion } from 'motion/react'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { cn } from '../utils/cn'
import type { ClientRectLike } from '../utils/dom'
import { getViewportRect, isBrowser, portalHost } from '../utils/dom'

const FLOATING_OFFSET = 8
export interface TourPopoverProps {
  target: TourTargetInfo
  children: ReactNode
  offset?: number
  maxWidth?: number
  zIndex?: number
  className?: string
}

export const TourPopover = ({
  target,
  children,
  offset = 16,
  maxWidth = 360,
  zIndex = 1001,
  className,
}: TourPopoverProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const hasPresentedRef = useRef(false)
  const lastReadyTargetRef = useRef<{
    rect: ClientRectLike
    isScreen: boolean
  } | null>(null)

  useEffect(() => {
    if (target.status === 'ready') {
      hasPresentedRef.current = true
      if (target.rect) {
        lastReadyTargetRef.current = {
          rect: { ...target.rect },
          isScreen: target.isScreen,
        }
      }
    } else if (target.status === 'idle') {
      hasPresentedRef.current = false
      lastReadyTargetRef.current = null
    }
  }, [target.rect, target.isScreen, target.status])

  const viewport = getViewportRect()
  const resolvedInfo =
    target.status === 'ready' && target.rect
      ? { rect: target.rect, isScreen: target.isScreen }
      : lastReadyTargetRef.current

  const fallbackRect = resolvedInfo?.rect ?? target.rect ?? viewport
  const fallbackIsScreen = resolvedInfo?.isScreen ?? target.isScreen

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
    ? 'translate(-50%, -50%)'
    : 'translate(-50%, 0)'
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
      transform: 'translate(-50%, -50%)',
    }),
    [viewport.height, viewport.width],
  )

  const floatingRef = useRef<HTMLDivElement | null>(null)
  const [floatingPosition, setFloatingPosition] = useState(fallbackPosition)

  useLayoutEffect(() => {
    if (target.status !== 'ready' && lastReadyTargetRef.current) {
      return
    }
    setFloatingPosition(fallbackPosition)
  }, [fallbackPosition, target.status])

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

    const updatePosition = async () => {
      const { x, y } = await computePosition(virtualReference, floatingEl, {
        placement: 'bottom',
        strategy: 'fixed',
        middleware: [
          floatingOffset(offset),
          flip({ padding: FLOATING_OFFSET }),
          shift({ padding: FLOATING_OFFSET }),
        ],
      })

      if (cancelled) return
      setFloatingPosition({ top: y, left: x, transform: 'translate3d(0,0,0)' })
    }

    void updatePosition()

    return () => {
      cancelled = true
    }
  }, [offset, target.isScreen, target.lastUpdated, target.status])

  return createPortal(
    <motion.div
      ref={floatingRef}
      transition={{
        duration: 0.25,
        ease: 'easeOut',
      }}
      className={cn(baseClass, 'overflow-hidden')}
      style={{
        zIndex,
        maxWidth,
      }}
      initial={{
        filter: 'blur(4px)',
        opacity: 0,
        top: centerInitialPosition.top,
        left: centerInitialPosition.left,
        transform: centerInitialPosition.transform,
      }}
      animate={{
        filter: 'blur(0)',
        opacity: 1,
        top: floatingPosition.top,
        left: floatingPosition.left,
        transform: floatingPosition.transform,
      }}
      exit={{
        filter: 'blur(4px)',
        opacity: 0,
      }}
      role="dialog"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={target.stepId}
          initial={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, translateX: 0, filter: 'blur(0)' }}
          exit={{ opacity: 0, translateX: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>,
    host,
  )
}
