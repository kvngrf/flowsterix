import type { Variants } from 'motion/react'
import { motion } from 'motion/react'
import type { KeyboardEventHandler } from 'react'
import { useEffect, useMemo, useRef } from 'react'

export type HoldToSkipButtonProps = {
  label: string
  holdDurationMs?: number
  onConfirm: () => void
  className?: string
}

const baseClassName =
  'rounded-full relative flex-1 cursor-pointer font-semibold'

export const HoldToSkipButton = ({
  label,
  holdDurationMs = 1_000,
  onConfirm,
  className,
}: HoldToSkipButtonProps) => {
  const holdTimeoutRef = useRef<number | null>(null)
  const holdReadyRef = useRef(false)

  const progressVariants = useMemo<Variants>(
    () => ({
      delete: {
        clipPath: 'inset(0% 0% 0% 100%)',
        transition: { duration: holdDurationMs / 1000, ease: 'linear' },
      },
      normal: {
        clipPath: 'inset(0% 0% 0% 0%)',
        transition: { duration: 0.3, type: 'decay' as const },
      },
    }),
    [holdDurationMs],
  )

  const tooltipVariants = useMemo<Variants>(
    () => ({
      delete: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
      },
      normal: {
        opacity: 0,
        filter: 'blur(2px)',
        y: 8,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
    }),
    [],
  )

  const clearHoldTimeout = () => {
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
  }

  const resetHoldState = () => {
    holdReadyRef.current = false
    clearHoldTimeout()
  }

  const startHold = () => {
    resetHoldState()
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
  }, [])

  const combinedClassName = [baseClassName, className].filter(Boolean).join(' ')

  return (
    <motion.button
      type="button"
      className={combinedClassName}
      whileTap="delete"
      initial="normal"
      animate="normal"
      onPointerDown={startHold}
      onPointerUp={completeHold}
      onPointerLeave={resetHoldState}
      onPointerCancel={resetHoldState}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={resetHoldState}
    >
      <motion.div
        variants={tooltipVariants}
        className="font-normal min-w-max text-xs absolute -top-[70%] left-1/2 -translate-x-1/2 bg-zinc-200 text-zinc-900 px-2 py-1 rounded-md"
      >
        Hold to confirm
      </motion.div>
      <motion.div className="rounded-full px-1 py-1.5 border bg-red-900 text-red-100 absolute inset-0 flex justify-center items-center shrink-0">
        {label}
      </motion.div>
      <motion.div
        variants={progressVariants}
        className="rounded-full px-2 py-1.5 border text-black bg-white absolute inset-0 flex justify-center items-center shrink-0"
      >
        {label}
      </motion.div>
    </motion.button>
  )
}
