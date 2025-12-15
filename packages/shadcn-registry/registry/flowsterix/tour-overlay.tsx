'use client'

import { useTour, useTourOverlay, useTourTarget } from '@flowsterix/headless'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

export interface TourOverlayProps {
  /** Additional class names for the overlay */
  className?: string
  /** Padding around the highlighted target (default: 8) */
  padding?: number
  /** Border radius of the highlight cutout (default: 8) */
  radius?: number
  /** Background color/opacity of the overlay (default: "rgba(0, 0, 0, 0.5)") */
  backdropColor?: string
  /** Whether clicking the backdrop advances/dismisses the tour */
  backdropClickBehavior?: 'none' | 'advance' | 'dismiss'
  /** Optional ring/glow effect around the target */
  showRing?: boolean
  /** Ring color (default: "rgba(255, 255, 255, 0.3)") */
  ringColor?: string
  /** Z-index for the overlay (default: 1000) */
  zIndex?: number
}

export function TourOverlay({
  className,
  padding = 8,
  radius = 8,
  backdropColor = 'rgba(0, 0, 0, 0.5)',
  backdropClickBehavior = 'none',
  showRing = true,
  ringColor = 'rgba(255, 255, 255, 0.3)',
  zIndex = 1000,
}: TourOverlayProps) {
  const { state, activeStep, next, cancel } = useTour()
  const target = useTourTarget()
  const overlay = useTourOverlay({ padding, radius })

  const isRunning = state?.status === 'running'
  const isScreenTarget = activeStep?.target === 'screen'
  const rect = target.rect ?? target.lastResolvedRect

  const handleBackdropClick = React.useCallback(() => {
    if (backdropClickBehavior === 'advance') {
      next()
    } else if (backdropClickBehavior === 'dismiss') {
      cancel('backdrop-click')
    }
  }, [backdropClickBehavior, next, cancel])

  if (!isRunning || !activeStep) {
    return null
  }

  // For screen targets, just show a simple backdrop
  if (isScreenTarget) {
    const content = (
      <AnimatePresence>
        <motion.div
          key="screen-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('fixed inset-0', className)}
          style={{
            zIndex,
            backgroundColor: backdropColor,
            pointerEvents: backdropClickBehavior === 'none' ? 'none' : 'auto',
          }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      </AnimatePresence>
    )

    if (typeof document === 'undefined') return null
    return createPortal(content, document.body)
  }

  // For element targets, use clip-path to create spotlight effect
  const clipPath = rect
    ? createSpotlightClipPath(rect, padding, radius)
    : undefined

  const content = (
    <AnimatePresence>
      <motion.div
        key="element-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('fixed inset-0', className)}
        style={{
          zIndex,
          backgroundColor: backdropColor,
          clipPath,
          pointerEvents: backdropClickBehavior === 'none' ? 'none' : 'auto',
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Highlight ring around target */}
      {showRing && rect && (
        <motion.div
          key="highlight-ring"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="pointer-events-none fixed"
          style={{
            zIndex: zIndex + 1,
            left: rect.left - padding - 2,
            top: rect.top - padding - 2,
            width: rect.width + padding * 2 + 4,
            height: rect.height + padding * 2 + 4,
            borderRadius: radius + 2,
            boxShadow: `0 0 0 2px ${ringColor}, 0 0 20px 4px ${ringColor}`,
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

/**
 * Creates a CSS clip-path that cuts out a rounded rectangle for the spotlight effect.
 * Uses polygon with inset to create the "hole" in the overlay.
 */
function createSpotlightClipPath(
  rect: DOMRect,
  padding: number,
  radius: number,
): string {
  const x = rect.left - padding
  const y = rect.top - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2

  // Create an inset path that carves out the target area
  // This creates a full-screen polygon with a rectangular hole
  return `polygon(
    0% 0%,
    0% 100%,
    ${x}px 100%,
    ${x}px ${y + radius}px,
    ${x + radius}px ${y}px,
    ${x + w - radius}px ${y}px,
    ${x + w}px ${y + radius}px,
    ${x + w}px ${y + h - radius}px,
    ${x + w - radius}px ${y + h}px,
    ${x + radius}px ${y + h}px,
    ${x}px ${y + h - radius}px,
    ${x}px 100%,
    100% 100%,
    100% 0%
  )`
}
