'use client'

import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from '@floating-ui/react'
import { useTour, useTourTarget } from '@flowsterix/headless'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

export interface TourPopoverProps {
  /** Additional class names for the popover container */
  className?: string
  /** Offset distance from the target element (default: 12) */
  offset?: number
  /** Preferred placement relative to target (default: "bottom") */
  placement?: Placement
  /** Whether to show the arrow pointer (default: true) */
  showArrow?: boolean
  /** Custom content renderer, receives step content as children */
  children?: React.ReactNode
}

export function TourPopover({
  className,
  offset: offsetValue = 12,
  placement = 'bottom',
  showArrow = true,
  children,
}: TourPopoverProps) {
  const { state, activeStep } = useTour()
  const target = useTourTarget()
  const arrowRef = React.useRef<HTMLDivElement>(null)

  const isRunning = state?.status === 'running'
  const rect = target.rect ?? target.lastResolvedRect
  const isScreenTarget = activeStep?.target === 'screen'

  // Virtual element for Floating UI when targeting a DOM element
  const virtualElement = React.useMemo(() => {
    if (!rect || isScreenTarget) return null
    return {
      getBoundingClientRect: () => rect,
    }
  }, [rect, isScreenTarget])

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement,
    elements: {
      reference: virtualElement ?? undefined,
    },
    middleware: [
      offset(offsetValue),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      ...(showArrow ? [arrow({ element: arrowRef })] : []),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Don't render if tour isn't running or no active step
  if (!isRunning || !activeStep) {
    return null
  }

  const popoverContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeStep.id}
        ref={refs.setFloating}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step: ${activeStep.id}`}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'z-[1001] w-[320px] max-w-[calc(100vw-2rem)]',
          'rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isScreenTarget &&
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          className,
        )}
        style={isScreenTarget ? undefined : floatingStyles}
      >
        {/* Popover content */}
        {children ?? activeStep.content}

        {/* Arrow */}
        {showArrow && !isScreenTarget && middlewareData.arrow && (
          <div
            ref={arrowRef}
            className="absolute h-3 w-3 rotate-45 border-b border-r bg-popover"
            style={{
              left: middlewareData.arrow.x,
              top: middlewareData.arrow.y,
              [placement.includes('top') ? 'bottom' : 'top']: -6,
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )

  // Render in a portal to avoid z-index issues
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(popoverContent, document.body)
}
