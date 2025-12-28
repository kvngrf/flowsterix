'use client'

import { useTour, useTourControls } from '@flowsterix/headless'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TourControlsProps {
  /** Additional class names for the controls container */
  className?: string
  /** Whether to show the skip button (default: true) */
  showSkip?: boolean
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
  labels,
  primaryVariant = 'default',
  secondaryVariant = 'outline',
}: TourControlsProps) {
  const { cancel } = useTour()
  const {
    showBackButton,
    backDisabled,
    showNextButton,
    nextDisabled,
    isLast,
    isActive,
    goBack,
    goNext,
  } = useTourControls()

  if (!isActive) {
    return null
  }

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
            onClick={goBack}
            disabled={backDisabled}
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
          onClick={goNext}
          disabled={nextDisabled}
          data-tour-button={isLast ? 'finish' : 'next'}
        >
          {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
        </Button>
      )}
    </div>
  )
}
