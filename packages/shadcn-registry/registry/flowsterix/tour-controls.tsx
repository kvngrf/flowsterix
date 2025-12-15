'use client'

import { useTour } from '@flowsterix/headless'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TourControlsProps {
  /** Additional class names for the controls container */
  className?: string
  /** Whether to show the skip button (default: true) */
  showSkip?: boolean
  /** Whether to show the back button (default: true) */
  showBack?: boolean
  /** Custom labels for buttons */
  labels?: {
    back?: string
    next?: string
    finish?: string
    skip?: string
  }
  /** Button variant for primary action */
  primaryVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
  /** Button variant for secondary actions */
  secondaryVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

export function TourControls({
  className,
  showSkip = true,
  showBack = true,
  labels,
  primaryVariant = 'default',
  secondaryVariant = 'outline',
}: TourControlsProps) {
  const { state, activeStep, next, back, cancel } = useTour()

  const isRunning = state?.status === 'running'
  const currentIndex = state?.stepIndex ?? 0
  const isFirstStep = currentIndex === 0
  const isLastStep = activeStep
    ? state?.stepIndex === (state as any)?.flow?.steps?.length - 1
    : false

  // Check if step has manual advance rule (shows next button)
  const hasManualAdvance = React.useMemo(() => {
    if (!activeStep?.advance) return true // Default to manual
    return activeStep.advance.some((rule: any) => rule.type === 'manual')
  }, [activeStep])

  // Check if back is disabled by advance rules
  const backLocked = React.useMemo(() => {
    if (!activeStep?.advance) return false
    return activeStep.advance.some((rule: any) => rule.lockBack)
  }, [activeStep])

  if (!isRunning || !activeStep) {
    return null
  }

  const showBackButton = showBack && !isFirstStep && !backLocked
  const showNextButton = hasManualAdvance

  return (
    <div
      className={cn('mt-4 flex items-center justify-between gap-2', className)}
      data-tour-controls=""
    >
      {/* Secondary actions: Back + Skip */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button
            variant={secondaryVariant}
            size="sm"
            onClick={() => back()}
            data-tour-button="back"
          >
            {labels?.back ?? 'Back'}
          </Button>
        )}
        {showSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cancel('skipped')}
            data-tour-button="skip"
          >
            {labels?.skip ?? 'Skip tour'}
          </Button>
        )}
      </div>

      {/* Primary action: Next/Finish */}
      {showNextButton && (
        <Button
          variant={primaryVariant}
          size="sm"
          onClick={() => next()}
          data-tour-button={isLastStep ? 'finish' : 'next'}
        >
          {isLastStep ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
        </Button>
      )}
    </div>
  )
}
