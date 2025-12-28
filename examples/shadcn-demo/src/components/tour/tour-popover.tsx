'use client'

import type { StepPlacement } from '@flowsterix/core'
import {
  TourPopoverPortal,
  useTour,
  useTourTarget,
  type TourPopoverLayoutMode,
  type TourPopoverPortalRenderProps,
} from '@flowsterix/headless'
import * as React from 'react'

import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export type { TourPopoverLayoutMode }

export interface TourPopoverProps {
  /** Additional class names for the popover container */
  className?: string
  /** Additional class names for the content wrapper */
  contentClassName?: string
  /** Offset distance from the target element (default: 16) */
  offset?: number
  /** Preferred placement relative to target */
  placement?: StepPlacement
  /** Fixed width for the popover */
  width?: number | string
  /** Maximum width for the popover */
  maxWidth?: number | string
  /** Z-index for the popover (default: 1001) */
  zIndex?: number
  /** ARIA role for the popover (default: "dialog") */
  role?: string
  /** ARIA label for the popover */
  ariaLabel?: string
  /** Whether the popover is modal (default: false) */
  ariaModal?: boolean
  /** Show drag handle for docked/manual mode (default: true) */
  showDragHandle?: boolean
  /** Custom content renderer */
  children?: React.ReactNode
}

// =============================================================================
// Drag Handle Component
// =============================================================================

interface DragHandleProps {
  dragHandleProps: TourPopoverPortalRenderProps['dragHandleProps']
  className?: string
}

function DragHandle({ dragHandleProps, className }: DragHandleProps) {
  const { style, ...rest } = dragHandleProps
  return (
    <button
      {...rest}
      style={style as React.CSSProperties}
      className={cn(
        'absolute -top-2 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing',
        'h-5 w-10 flex items-center justify-center',
        'text-muted-foreground hover:text-foreground transition-colors',
        className,
      )}
    >
      <svg
        width="24"
        height="4"
        viewBox="0 0 24 4"
        fill="currentColor"
        aria-hidden
      >
        <rect x="0" y="0" width="24" height="1.5" rx="0.75" />
        <rect x="0" y="2.5" width="24" height="1.5" rx="0.75" />
      </svg>
    </button>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function TourPopover({
  className,
  contentClassName,
  offset = 16,
  placement,
  width,
  maxWidth = 360,
  zIndex = 1001,
  role = 'dialog',
  ariaLabel,
  ariaModal = false,
  showDragHandle = true,
  children,
}: TourPopoverProps) {
  const { state, activeStep } = useTour()
  const target = useTourTarget()

  const isRunning = state?.status === 'running'

  if (!isRunning || !activeStep) {
    return null
  }

  // Get placement from step or props
  const resolvedPlacement = activeStep.placement ?? placement ?? 'bottom'

  return (
    <TourPopoverPortal
      target={target}
      offset={offset}
      placement={resolvedPlacement}
      width={width}
      maxWidth={maxWidth}
      zIndex={zIndex}
      role={role}
      ariaLabel={ariaLabel}
      ariaModal={ariaModal}
    >
      {({
        Container,
        Content,
        containerProps,
        contentProps,
        layoutMode,
        showDragHandle: shouldShowHandle,
        dragHandleProps,
        descriptionProps,
      }) => (
        <Container
          {...containerProps}
          className={cn(
            // Base styles
            'rounded-xl border bg-popover text-popover-foreground shadow-lg',
            // Mobile mode takes full width
            layoutMode === 'mobile' && 'w-[calc(100vw-24px)] max-w-md',

            className,
          )}
        >
          {/* Drag handle for docked/manual mode */}
          {showDragHandle && shouldShowHandle && (
            <DragHandle dragHandleProps={dragHandleProps} />
          )}

          {/* Content with crossfade animation */}
          <Content {...contentProps} className={cn('p-4', contentClassName)}>
            {/* Screen reader description */}
            {descriptionProps.id && descriptionProps.text && (
              <span id={descriptionProps.id} className="sr-only">
                {descriptionProps.text}
              </span>
            )}

            {/* Render step content or custom children */}
            {children ?? activeStep.content}
          </Content>
        </Container>
      )}
    </TourPopoverPortal>
  )
}
