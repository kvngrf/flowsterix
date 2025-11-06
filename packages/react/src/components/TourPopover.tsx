import type { ReactNode } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { VirtualElement } from '@floating-ui/dom'
import {
  computePosition,
  flip,
  offset as floatingOffset,
  shift,
} from '@floating-ui/dom'
import { AnimatePresence, motion } from 'motion/react'
import { useTour } from '../context'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { cn } from '../utils/cn'
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

  const { state } = useTour()
  const stepIndex = state?.stepIndex ?? -1
  const previousStepIndexRef = useRef(stepIndex)
  const directionRef = useRef<1 | -1>(1)

  if (stepIndex !== previousStepIndexRef.current) {
    directionRef.current = stepIndex >= previousStepIndexRef.current ? 1 : -1
    previousStepIndexRef.current = stepIndex
  }

  const direction = directionRef.current
  const enterOffset = direction === 1 ? '50px' : '-50px'
  const exitOffset = direction === 1 ? '-50px' : '50px'

  const viewport = getViewportRect()
  const rect = target.rect ?? viewport
  const baseTop = target.isScreen
    ? viewport.height / 2
    : rect.top + rect.height + offset
  const top = target.isScreen
    ? viewport.height / 2
    : Math.min(viewport.height - 24, Math.max(24, baseTop))
  const left = target.isScreen ? viewport.width / 2 : rect.left + rect.width / 2
  const baseClass = cn(
    'fixed w-max pointer-events-auto rounded-xl bg-white px-6 py-5 text-slate-900 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.35)]',
    className,
  )

  const fallbackPosition = useMemo(
    () => ({
      top,
      left,
      transform: target.isScreen
        ? 'translate(-50%, -50%)'
        : 'translate(-50%, 0)',
    }),
    [left, target.isScreen, top],
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
  }, [offset, target.isScreen, target.lastUpdated])

  return createPortal(
    <motion.div
      ref={floatingRef}
      transition={{
        duration: 0.4,
        ease: 'easeOut' as const,
        type: 'spring' as const,
        damping: 25,
        stiffness: 300,
        mass: 0.7,
      }}
      className={cn(baseClass, 'overflow-hidden')}
      style={{
        zIndex,
        maxWidth,
      }}
      animate={{
        top: floatingPosition.top,
        left: floatingPosition.left,
        transform: floatingPosition.transform,
      }}
      role="dialog"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={target.stepId}
          initial={{ opacity: 0, translateX: enterOffset, filter: 'blur(4px)' }}
          animate={{ opacity: 1, translateX: '0px', filter: 'blur(0)' }}
          exit={{ opacity: 0, translateX: exitOffset, filter: 'blur(4px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>,
    host,
  )
}
