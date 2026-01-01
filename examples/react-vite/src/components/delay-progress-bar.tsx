'use client'

import { useDelayAdvance } from '@flowsterix/headless'

import { cn } from '@/lib/utils'

export interface DelayProgressBarProps {
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  labelClassName?: string
  showCountdown?: boolean
  formatRemaining?: (milliseconds: number) => string
}

const defaultFormatter = (milliseconds: number) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${seconds}s remaining`
}

export function DelayProgressBar({
  className,
  trackClassName,
  indicatorClassName,
  labelClassName,
  showCountdown = true,
  formatRemaining = defaultFormatter,
}: DelayProgressBarProps) {
  const progress = useDelayAdvance()

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
        aria-label="Auto-advance progress"
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
          {formatRemaining(progress.remainingMs)}
        </span>
      ) : null}
    </div>
  )
}
