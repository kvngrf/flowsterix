'use client'

import { useTour, useTourLabels } from '@flowsterix/react'

import { cn } from '@/lib/utils'

export interface TourProgressProps {
  /** Additional class names for the progress container */
  className?: string
  /** Visual variant of the progress indicator */
  variant?: 'dots' | 'bar' | 'fraction' | 'steps'
  /** Size of the progress indicator */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show step labels (only for "steps" variant) */
  showLabels?: boolean
  /** Custom formatter for step progress aria-label (overrides provider labels) */
  ariaStepProgress?: (params: { current: number; total: number }) => string
}

export function TourProgress({
  className,
  variant = 'dots',
  size = 'md',
  showLabels = false,
  ariaStepProgress,
}: TourProgressProps) {
  const { state, activeStep, flows, activeFlowId } = useTour()
  const labels = useTourLabels()
  const formatAriaLabel = ariaStepProgress ?? labels.ariaStepProgress

  const isRunning = state?.status === 'running'
  const currentIndex = state?.stepIndex ?? 0
  const flow = activeFlowId ? flows.get(activeFlowId) : null
  const totalSteps = flow?.steps.length ?? 0

  if (!isRunning || !activeStep || totalSteps === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  const barHeightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  if (variant === 'dots') {
    return (
      <div
        className={cn('flex items-center justify-center gap-1.5', className)}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={formatAriaLabel({ current: currentIndex + 1, total: totalSteps })}
      >
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'rounded-full transition-all duration-200',
              sizeClasses[size],
              index === currentIndex
                ? 'bg-primary scale-125'
                : index < currentIndex
                  ? 'bg-primary/60'
                  : 'bg-muted-foreground/30',
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  if (variant === 'bar') {
    const progress = ((currentIndex + 1) / totalSteps) * 100

    return (
      <div
        className={cn('w-full', className)}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={formatAriaLabel({ current: currentIndex + 1, total: totalSteps })}
      >
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-muted',
            barHeightClasses[size],
          )}
        >
          <div
            className={cn(
              'h-full rounded-full bg-primary transition-all duration-300 ease-out',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'fraction') {
    return (
      <div
        className={cn('text-sm font-medium text-muted-foreground', className)}
        role="status"
        aria-label={formatAriaLabel({ current: currentIndex + 1, total: totalSteps })}
      >
        <span className="text-foreground">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{totalSteps}</span>
      </div>
    )
  }

  // variant === 'steps'
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={formatAriaLabel({ current: currentIndex + 1, total: totalSteps })}
    >
      {flow?.steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            'flex items-center gap-1.5',
            index < totalSteps - 1 && 'flex-1',
          )}
        >
          {/* Step indicator */}
          <div
            className={cn(
              'flex items-center justify-center rounded-full text-xs font-medium transition-all',
              size === 'sm' && 'h-5 w-5',
              size === 'md' && 'h-6 w-6',
              size === 'lg' && 'h-7 w-7',
              index === currentIndex
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                : index < currentIndex
                  ? 'bg-primary/80 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {index < currentIndex ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              index + 1
            )}
          </div>

          {/* Step label */}
          {showLabels && (
            <span
              className={cn(
                'hidden text-xs sm:inline',
                index === currentIndex
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {step.id}
            </span>
          )}

          {/* Connector line */}
          {index < totalSteps - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 transition-colors',
                index < currentIndex ? 'bg-primary/60' : 'bg-muted',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
