'use client'

import { TourHUD } from '@/components/tour-hud'
import { TourProvider, useTour } from '@/components/tour-provider'
import { landingTourFlow } from '@/lib/landing-tour'
import { Play } from 'lucide-react'
import { motion } from 'motion/react'

function StartTourButton() {
  const { startFlow, state } = useTour()

  const isRunning = state?.status === 'running'

  if (isRunning) return null

  return (
    <motion.button
      onClick={() => startFlow('landing-page-tour')}
      className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Play className="w-4 h-4" fill="currentColor" />
      Try the Tour
    </motion.button>
  )
}

export function TourWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      flows={[landingTourFlow]}
      storageNamespace="flowsterix-landing"
    >
      {children}
      <TourHUD
        overlay={{
          padding: 16,
          radius: 16,
          blurAmount: 4,
          showRing: true,
          ringShadow:
            '0 0 0 2px rgb(90 124 101), 0 0 30px rgb(90 124 101 / 0.25)',
        }}
        popover={{
          maxWidth: 380,
          offset: 20,
        }}
        progress={{
          show: true,
          variant: 'dots',
          position: 'bottom',
        }}
        controls={{
          showSkip: true,
          skipMode: 'click',
          labels: {
            next: 'Next',
            back: 'Back',
            finish: 'Finish Tour',
            skip: 'Skip Tour',
          },
        }}
      />
    </TourProvider>
  )
}

export { StartTourButton }
