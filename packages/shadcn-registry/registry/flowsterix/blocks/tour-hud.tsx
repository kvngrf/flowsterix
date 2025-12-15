'use client'

import { useTour } from '@flowsterix/headless'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { TourControls } from '@/registry/flowsterix/tour-controls'
import { TourOverlay } from '@/registry/flowsterix/tour-overlay'
import { TourPopover } from '@/registry/flowsterix/tour-popover'
import { TourProgress } from '@/registry/flowsterix/tour-progress'

export interface TourHUDProps {
  /** Additional class names for the HUD container */
  className?: string
  /** Overlay configuration */
  overlay?: {
    padding?: number
    radius?: number
    backdropColor?: string
    showRing?: boolean
  }
  /** Popover configuration */
  popover?: {
    offset?: number
    showArrow?: boolean
    className?: string
  }
  /** Controls configuration */
  controls?: {
    showSkip?: boolean
    showBack?: boolean
    labels?: {
      back?: string
      next?: string
      finish?: string
      skip?: string
    }
  }
  /** Progress indicator configuration */
  progress?: {
    show?: boolean
    variant?: 'dots' | 'bar' | 'fraction' | 'steps'
    position?: 'top' | 'bottom'
  }
  /** Custom content to render inside the popover */
  children?: React.ReactNode
  /** Custom step content renderer */
  renderContent?: (step: any) => React.ReactNode
}

/**
 * A complete heads-up display combining overlay, popover, controls, and progress.
 * This is the recommended starting point for most tour implementations.
 *
 * @example
 * ```tsx
 * import { TourProvider } from "@/components/tour/tour-provider"
 * import { TourHUD } from "@/components/tour/blocks/tour-hud"
 * import { myFlow } from "@/lib/tours/my-flow"
 *
 * export function App() {
 *   return (
 *     <TourProvider flows={[myFlow]}>
 *       <TourHUD
 *         overlay={{ padding: 12, showRing: true }}
 *         progress={{ show: true, variant: "dots" }}
 *       />
 *       <YourApp />
 *     </TourProvider>
 *   )
 * }
 * ```
 */
export function TourHUD({
  className,
  overlay = {},
  popover = {},
  controls = {},
  progress = { show: true, variant: 'dots', position: 'bottom' },
  children,
  renderContent,
}: TourHUDProps) {
  const { state, activeStep } = useTour()

  const isRunning = state?.status === 'running'

  if (!isRunning || !activeStep) {
    return null
  }

  const stepContent = renderContent
    ? renderContent(activeStep)
    : activeStep.content

  return (
    <>
      {/* Spotlight overlay */}
      <TourOverlay
        padding={overlay.padding}
        radius={overlay.radius}
        backdropColor={overlay.backdropColor}
        showRing={overlay.showRing}
      />

      {/* Content popover */}
      <TourPopover
        offset={popover.offset}
        showArrow={popover.showArrow}
        className={cn(popover.className, className)}
      >
        <div className="space-y-3">
          {/* Progress indicator (top position) */}
          {progress.show && progress.position === 'top' && (
            <TourProgress variant={progress.variant} size="sm" />
          )}

          {/* Step content */}
          <div>{children ?? stepContent}</div>

          {/* Progress indicator (bottom position - default) */}
          {progress.show && progress.position !== 'top' && (
            <TourProgress variant={progress.variant} size="sm" />
          )}

          {/* Navigation controls */}
          <TourControls
            showSkip={controls.showSkip}
            showBack={controls.showBack}
            labels={controls.labels}
          />
        </div>
      </TourPopover>
    </>
  )
}
