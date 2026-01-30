'use client'

import { useDelayAdvance, useTourLabels } from '@flowsterix/react'

import { cn } from '@/lib/utils'

export interface DelayProgressBarProps {
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  labelClassName?: string
  showCountdown?: boolean
  /** Custom formatter for remaining time (overrides provider labels) */
  formatRemaining?: (milliseconds: number) => string
  /** Custom aria-label for the progress bar (overrides provider labels) */
  ariaLabel?: string
}

export function DelayProgressBar({
  className,
  trackClassName,
  indicatorClassName,
  labelClassName,
  showCountdown = true,
  formatRemaining,
  ariaLabel,
}: DelayProgressBarProps) {
  const progress = useDelayAdvance()
  const labels = useTourLabels()
  const formatter = formatRemaining ?? ((ms: number) => labels.formatTimeRemaining({ ms }))
  const resolvedAriaLabel = ariaLabel ?? labels.ariaDelayProgress

  if (!progress.flowId || progress.totalMs <= 0) {
    return null
  }

  const fillRatio = Math.min(1, Math.max(0, progress.fractionElapsed))
  const elapsedMs = Math.max(0, progress.totalMs - progress.remainingMs)

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div
        className={cn(
          'h-2 w-full overflow-hidden rounded-full bg-muted',
          trackClassName,
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.totalMs}
        aria-valuenow={elapsedMs}
        aria-label={resolvedAriaLabel}
      >
        <div
          className={cn(
            'h-full w-full bg-primary transition-transform duration-200 ease-out',
            indicatorClassName,
          )}
          style={{
            transform: `scaleX(${fillRatio})`,
            transformOrigin: 'left center',
            willChange: 'transform',
          }}
        />
      </div>
      {showCountdown ? (
        <span
          className={cn(
            'text-xs font-medium text-muted-foreground',
            labelClassName,
          )}
        >
          {formatter(progress.remainingMs)}
        </span>
      ) : null}
    </div>
  )
}
