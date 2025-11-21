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

const BUTTON_WHILE_TAP_VARIANTS: Variants = {
  delete: { scale: 0.95 },
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
      variants={BUTTON_WHILE_TAP_VARIANTS}
      initial="normal"
      onPointerDown={startHold}
      onPointerUp={completeHold}
      onPointerLeave={resetHoldState}
      onPointerCancel={resetHoldState}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={resetHoldState}
    >
      <motion.div className="rounded-full px-3 py-1.5 border bg-red-300 text-red-900 absolute inset-0 flex justify-center items-center shrink-0">
        {label}
      </motion.div>
      <motion.div
        variants={progressVariants}
        className="rounded-full px-3 py-1.5 border text-black bg-white absolute inset-0 flex justify-center items-center shrink-0"
      >
        {label}
      </motion.div>
    </motion.button>
  )
}
