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

  const isRunning = state?.status === 'running'

  // Track mouse position for tooltip placement
  React.useEffect(() => {
    if (!isRunning) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX + 16, y: e.clientY + 16 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isRunning])

  if (!isRunning || !activeStep) {
    return null
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[1001] max-w-xs rounded-md',
        'bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md',
        'border animate-in fade-in-0 zoom-in-95',
        className,
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      role="tooltip"
    >
      {children ?? activeStep.content}
    </div>
  )
}
