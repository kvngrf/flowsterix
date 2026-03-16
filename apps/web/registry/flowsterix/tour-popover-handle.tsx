'use client'

import type { TourPopoverPortalRenderProps } from '@flowsterix/react'

import { cn } from '@/lib/utils'

export interface TourPopoverHandleProps {
  dragHandleProps: TourPopoverPortalRenderProps['dragHandleProps']
  isDragging?: boolean
  className?: string
}

export function TourPopoverHandle({
  dragHandleProps,
  isDragging,
  className,
}: TourPopoverHandleProps) {
  const { style, ...rest } = dragHandleProps

  return (
    <button
      {...rest}
      type="button"
      aria-label="Drag to reposition"
      className={cn(
        'group absolute z-10 right-0 top-0 flex h-11 w-11 select-none items-center justify-center rounded-full bg-transparent transition-colors',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        '[@media(hover:hover)]:hover:bg-muted',
        className,
      )}
      style={style}
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
        className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80"
        aria-hidden="true"
      >
        <path d="M12 2v20" />
        <path d="m15 19-3 3-3-3" />
        <path d="m19 9 3 3-3 3" />
        <path d="M2 12h20" />
        <path d="m5 9-3 3 3 3" />
        <path d="m9 5 3-3 3 3" />
      </svg>
    </button>
  )
}
