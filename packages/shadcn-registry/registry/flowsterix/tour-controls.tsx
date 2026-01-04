'use client'

import { useHudMotion, useTour, useTourControls } from '@flowsterix/react'
import { AnimatePresence, motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { HoldToSkipButton } from '@/registry/flowsterix/hold-to-skip-button'

export interface TourControlsProps {
  /** Additional class names for the controls container */
  className?: string
  /** Whether to show the skip button (default: true) */
  showSkip?: boolean
  /** Skip button mode: 'click' for instant skip, 'hold' for hold-to-confirm (default: 'click') */
  skipMode?: 'click' | 'hold'
  /** Duration in ms to hold skip button when skipMode is 'hold' (default: 1000) */
  skipHoldDurationMs?: number
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
  skipMode = 'click',
  skipHoldDurationMs = 1000,
  labels,
  primaryVariant = 'default',
  secondaryVariant = 'outline',
}: TourControlsProps) {
  const { transitions } = useHudMotion()
  const { popoverContent: popoverContentTransition } = transitions
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
    <motion.div
      layout="position"
      className={cn('flex items-center justify-between gap-2 p-4', className)}
      data-tour-controls=""
      transition={{ layout: { duration: 0.2, ease: 'easeOut', type: 'tween' } }}
    >
      <motion.div
        className="flex items-center gap-2"
        layout="position"
        transition={{
          layout: { duration: 0.2, ease: 'easeOut', type: 'tween' },
        }}
      >
        <AnimatePresence initial={false}>
          {showBackButton && (
            <motion.div
              key="tour-control-back"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={popoverContentTransition}
              layout="position"
            >
              <Button
                asChild
                variant={secondaryVariant}
                size="sm"
                onClick={goBack}
                disabled={backDisabled}
                data-tour-button="back"
              >
                <motion.button
                  layout="position"
                  layoutId="tour-control-back"
                  transition={{
                    layout: { duration: 0.2, ease: 'easeOut', type: 'tween' },
                  }}
                >
                  <span>{labels?.back ?? 'Back'}</span>
                </motion.button>
              </Button>
            </motion.div>
          )}
          {showSkip && skipMode === 'hold' && (
            <motion.div
              key="tour-control-skip-hold"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={popoverContentTransition}
              layout="position"
            >
              <HoldToSkipButton
                label={labels?.skip ?? 'Skip tour'}
                holdDurationMs={skipHoldDurationMs}
                onConfirm={() => cancel('skipped')}
              />
            </motion.div>
          )}
          {showSkip && skipMode === 'click' && (
            <motion.div
              key="tour-control-skip-click"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={popoverContentTransition}
              layout="position"
            >
              <Button
                asChild
                variant="ghost"
                size="sm"
                onClick={() => cancel('skipped')}
                data-tour-button="skip"
              >
                <motion.button
                  layout="position"
                  transition={{
                    layout: { duration: 0.2, ease: 'easeOut', type: 'tween' },
                  }}
                >
                  {labels?.skip ?? 'Skip tour'}
                </motion.button>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence initial={false}>
        {showNextButton && (
          <motion.div
            key="tour-control-primary"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={popoverContentTransition}
            layout="position"
          >
            <Button
              asChild
              variant={primaryVariant}
              size="sm"
              onClick={goNext}
              disabled={nextDisabled}
              data-tour-button={isLast ? 'finish' : 'next'}
            >
              <motion.button
                layout="position"
                layoutId="tour-control-primary"
                transition={{
                  layout: { duration: 0.2, ease: 'easeOut', type: 'tween' },
                }}
              >
                {isLast
                  ? (labels?.finish ?? 'Finish')
                  : (labels?.next ?? 'Next')}
              </motion.button>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
