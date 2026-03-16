'use client'

import { useTour } from '@flowsterix/react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TourTooltipProps {
  /** Additional class names for the tooltip */
  className?: string
  /** Tooltip content - defaults to step content if not provided */
  children?: React.ReactNode
}

/**
 * A lightweight tooltip variant for simpler tour implementations.
 * Renders near the cursor or target with minimal styling.
 */
export function TourTooltip({ className, children }: TourTooltipProps) {
  const { state, activeStep } = useTour()
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [hasPosition, setHasPosition] = React.useState(false)

  const isRunning = state?.status === 'running'

  // Track mouse position for tooltip placement (mouse-only component)
  React.useEffect(() => {
    if (!isRunning) return

    // Detect touch-primary devices and bail — this component is mouse-only
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX + 16, y: e.clientY + 16 })
      setHasPosition(true)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      setHasPosition(false)
    }
  }, [isRunning])

  if (!isRunning || !activeStep || !hasPosition) {
    return null
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[1001] max-w-xs rounded-md',
        'bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md',
        'border',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
        className,
      )}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        top: 0,
        left: 0,
      }}
      role="tooltip"
    >
      {children ?? activeStep.content}
    </div>
  )
}
