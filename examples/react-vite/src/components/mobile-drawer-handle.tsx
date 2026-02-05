'use client'

import { cn } from '@/lib/utils'

export interface MobileDrawerHandleProps {
  className?: string
  isDragging?: boolean
}

/**
 * Horizontal pill handle for mobile drawer swipe affordance.
 * Centered at top of drawer, provides visual indication that drawer is draggable.
 */
export function MobileDrawerHandle({
  className,
  isDragging,
}: MobileDrawerHandleProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center py-3',
        'touch-none select-none',
        className,
      )}
      data-mobile-drawer-handle=""
    >
      <div
        className={cn(
          'h-1 w-10 rounded-full transition-colors duration-150',
          'bg-muted-foreground/30',
          isDragging && 'bg-muted-foreground/50',
        )}
      />
    </div>
  )
}
