import { motion } from 'motion/react'

import { useDelayAdvance } from '../hooks/useDelayAdvance'
import { cn } from '../utils/cn'

export interface DelayProgressBarProps {
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  showCountdown?: boolean
  formatRemaining?: (milliseconds: number) => string
}

const defaultFormatter = (milliseconds: number) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${seconds}s remaining`
}

export const DelayProgressBar = ({
  className,
  trackClassName,
  indicatorClassName,
  showCountdown = true,
  formatRemaining = defaultFormatter,
}: DelayProgressBarProps) => {
  const progress = useDelayAdvance()

  if (!progress.flowId || progress.totalMs <= 0) {
    return null
  }

  const remainingRatio = Math.min(1, Math.max(0, progress.fractionRemaining))

  return (
    <div
      className={cn('tour-delay-progress', className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}
    >
      <div
        className={cn('tour-delay-progress-track', trackClassName)}
        style={{
          position: 'relative',
          width: '100%',
          height: 6,
          borderRadius: 9999,
          background: 'rgba(148, 163, 184, 0.35)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          className={cn('tour-delay-progress-indicator', indicatorClassName)}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: remainingRatio }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            background: 'rgb(15, 23, 42)',
          }}
        />
      </div>
      {showCountdown ? (
        <span
          className={cn('tour-delay-progress-label')}
          style={{ fontSize: 12, fontWeight: 500, color: 'rgb(100, 116, 139)' }}
        >
          {formatRemaining(progress.remainingMs)}
        </span>
      ) : null}
    </div>
  )
}
