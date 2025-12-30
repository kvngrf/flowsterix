'use client'

import type { BackdropInteractionMode } from '@flowsterix/core'
import {
  OverlayBackdrop,
  useTour,
  useTourOverlay,
  useTourTarget,
} from '@flowsterix/headless'

import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface TourOverlayProps {
  /** Additional class names for the root container */
  className?: string
  /** Additional class names for the backdrop layer */
  backdropClassName?: string
  /** Additional class names for the highlight ring */
  ringClassName?: string
  /** Padding around the highlighted target (default: 12) */
  padding?: number
  /** Border radius of the highlight cutout (default: 12) */
  radius?: number
  /** Edge buffer to prevent cutout from touching viewport edges (default: 0) */
  edgeBuffer?: number
  /** Background color of the overlay */
  backdropColor?: string
  /** Backdrop blur amount in pixels (default: 6) */
  blurAmount?: number
  /** Opacity of the backdrop (default: 1) */
  opacity?: number
  /** Custom box-shadow for the highlight ring */
  ringShadow?: string
  /** Whether to show the highlight ring around the target (default: true) */
  showRing?: boolean
  /** Whether to render interaction blockers when in 'block' mode */
  showInteractionBlocker?: boolean
  /** Z-index for the overlay (default: 1000) */
  zIndex?: number
  /** Override the interaction mode from the flow */
  interactionMode?: BackdropInteractionMode
  /** Whether the overlay is hidden from screen readers */
  ariaHidden?: boolean
}

// =============================================================================
// Main Component
// =============================================================================

export function TourOverlay({
  className,
  backdropClassName,
  ringClassName,
  padding = 12,
  radius = 12,
  edgeBuffer = 0,
  backdropColor,
  blurAmount = 6,
  opacity = 1,
  ringShadow,
  showRing = true,
  showInteractionBlocker = true,
  zIndex = 1000,
  interactionMode,
  ariaHidden = true,
}: TourOverlayProps) {
  const { state, activeStep, backdropInteraction } = useTour()
  const target = useTourTarget()

  // Use prop override or flow's backdrop interaction setting
  const resolvedInteractionMode = interactionMode ?? backdropInteraction

  const overlay = useTourOverlay({
    target,
    padding,
    radius,
    edgeBuffer,
    interactionMode: resolvedInteractionMode,
  })

  const isRunning = state?.status === 'running'

  if (!isRunning || !activeStep) {
    return null
  }

  return (
    <OverlayBackdrop
      overlay={overlay}
      zIndex={zIndex}
      color={backdropColor}
      colorClassName={cn('bg-black/50', backdropClassName)}
      blurAmount={blurAmount}
      opacity={opacity}
      shadow={ringShadow}
      shadowClassName={ringClassName}
      showHighlightRing={showRing}
      showInteractionBlocker={showInteractionBlocker}
      ariaHidden={ariaHidden}
      rootClassName={className}
    />
  )
}
