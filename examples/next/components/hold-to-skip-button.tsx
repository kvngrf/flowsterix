'use client'

import { useTourLabels } from '@flowsterix/react'
import type { Variants } from 'motion/react'
import { motion, useReducedMotion } from 'motion/react'
import type { KeyboardEventHandler } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HoldToSkipButtonProps {
  /** Button label text (overrides provider labels) */
  label?: string
  /** Duration in ms to hold before confirming (default: 1000) */
  holdDurationMs?: number
  /** Callback when hold is completed */
  onConfirm: () => void
  /** Tooltip text shown while holding (overrides provider labels) */
  tooltipText?: string
  /** Additional class names */
  className?: string
}

export function HoldToSkipButton({
  label,
  holdDurationMs = 1000,
  onConfirm,
  tooltipText,
  className,
}: HoldToSkipButtonProps) {
  const labels = useTourLabels()
  const reducedMotion = useReducedMotion()
  const resolvedLabel = label ?? labels.skip
  const resolvedTooltipText = tooltipText ?? labels.holdToConfirm
  const holdTimeoutRef = useRef<number | null>(null)
  const holdReadyRef = useRef(false)
  const [isHolding, setIsHolding] = useState(false)

  const progressVariants = useMemo<Variants>(
    () => ({
      holding: {
        clipPath: 'inset(0% 0% 0% 0%)',
        transition: {
          duration: reducedMotion ? 0.001 : holdDurationMs / 1000,
          ease: 'linear',
        },
      },
      idle: {
        clipPath: 'inset(0% 100% 0% 0%)',
        transition: {
          duration: reducedMotion ? 0.001 : 0.2,
          ease: [0.25, 1, 0.5, 1],
        },
      },
    }),
    [holdDurationMs, reducedMotion],
  )

  const tooltipVariants = useMemo<Variants>(
    () => ({
      holding: {
        opacity: 1,
        filter: reducedMotion ? 'none' : 'blur(0px)',
        y: 0,
        transition: {
          duration: reducedMotion ? 0.001 : 0.2,
          ease: [0.25, 1, 0.5, 1],
        },
      },
      idle: {
        opacity: 0,
        filter: reducedMotion ? 'none' : 'blur(2px)',
        y: reducedMotion ? 0 : 8,
        transition: {
          duration: reducedMotion ? 0.001 : 0.16,
          ease: [0.25, 1, 0.5, 1],
        },
      },
    }),
    [reducedMotion],
  )

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
  }, [])

  const resetHoldState = useCallback(() => {
    setIsHolding(false)
    holdReadyRef.current = false
    clearHoldTimeout()
  }, [clearHoldTimeout])

  const startHold = () => {
    resetHoldState()
    setIsHolding(true)
    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null
      holdReadyRef.current = true
    }, holdDurationMs)
  }

  const completeHold = () => {
    const shouldConfirm = holdReadyRef.current
    resetHoldState()
    if (shouldConfirm) {
      onConfirm()
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (event.repeat) return
    event.preventDefault()
    startHold()
  }

  const handleKeyUp: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    completeHold()
  }

  useEffect(() => {
    return () => {
      resetHoldState()
    }
  }, [resetHoldState])

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        'relative cursor-pointer select-none',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        className,
      )}
      data-tour-button="skip"
    >
      <motion.button
        type="button"
        layout="position"
        transition={{
          layout: {
            duration: reducedMotion ? 0.001 : 0.2,
            ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
            type: 'tween',
          },
        }}
        initial={false}
        animate={isHolding ? 'holding' : 'idle'}
        onPointerDown={startHold}
        onPointerUp={completeHold}
        onPointerLeave={resetHoldState}
        onPointerCancel={resetHoldState}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={resetHoldState}
      >
        <span aria-hidden="true">{resolvedLabel}</span>
        <motion.div
          variants={tooltipVariants}
          className={cn(
            'pointer-events-none absolute -top-2 left-1/2 min-w-max -translate-x-1/2 -translate-y-full',
            'rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md',
            'border border-border',
          )}
        >
          {resolvedTooltipText}
          <div className="absolute -bottom-1 left-1/2 -z-10 size-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-popover" />
        </motion.div>

        <motion.div
          className={cn(
            'absolute inset-0 flex shrink-0 items-center justify-center rounded-md',
            'border bg-background shadow-xs',
            'hover:bg-accent hover:text-accent-foreground',
            'dark:bg-popover dark:border-input dark:hover:bg-accent',
          )}
        >
          {resolvedLabel}
        </motion.div>

        <motion.div
          variants={progressVariants}
          className={cn(
            'absolute inset-0 flex shrink-0 items-center justify-center rounded-md border border-border',
            'bg-destructive text-background',
          )}
        >
          {resolvedLabel}
        </motion.div>
      </motion.button>
    </Button>
  )
}
