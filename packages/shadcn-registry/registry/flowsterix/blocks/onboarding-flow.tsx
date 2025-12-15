'use client'

import type { FlowDefinition } from '@flowsterix/core'
import { createFlow } from '@flowsterix/core'
import * as React from 'react'

/**
 * Example onboarding flow demonstrating common patterns.
 *
 * Customize this flow for your application by:
 * 1. Updating the step targets to match your UI selectors
 * 2. Modifying the content to describe your features
 * 3. Adjusting advance rules based on your UX requirements
 *
 * @example
 * ```tsx
 * import { TourProvider } from "@/components/tour/tour-provider"
 * import { TourHUD } from "@/components/tour/blocks/tour-hud"
 * import { onboardingFlow } from "@/components/tour/blocks/onboarding-flow"
 *
 * export function App() {
 *   return (
 *     <TourProvider flows={[onboardingFlow]}>
 *       <TourHUD />
 *       <YourApp />
 *     </TourProvider>
 *   )
 * }
 *
 * // Trigger the tour:
 * const { startFlow } = useTour()
 * startFlow("onboarding")
 * ```
 */
export const onboardingFlow: FlowDefinition<React.ReactNode> = createFlow({
  id: 'onboarding',
  version: 1,
  steps: [
    // Step 1: Welcome screen (no target, centered modal)
    {
      id: 'welcome',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: (
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-semibold">Welcome to Your App! 👋</h2>
          <p className="text-muted-foreground">
            Let&apos;s take a quick tour to help you get started. This will only
            take a minute.
          </p>
        </div>
      ),
    },

    // Step 2: Highlight a navigation element
    {
      id: 'navigation',
      target: {
        selector: "[data-tour-target='navigation']",
        description: 'Main navigation menu',
      },
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Use the navigation menu to move between different sections of the
            app.
          </p>
        </div>
      ),
    },

    // Step 3: Highlight a feature with click-to-advance
    {
      id: 'main-feature',
      target: {
        selector: "[data-tour-target='main-feature']",
        description: 'Primary feature button',
      },
      placement: 'right',
      advance: [
        { type: 'manual' },
        { type: 'event', event: 'click', on: 'target' },
      ],
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Main Feature</h3>
          <p className="text-sm text-muted-foreground">
            Click this button to access the main feature. You can click it now
            or press Next to continue.
          </p>
        </div>
      ),
    },

    // Step 4: Settings with auto-advance delay
    {
      id: 'settings',
      target: {
        selector: "[data-tour-target='settings']",
        description: 'Settings button',
      },
      placement: 'left',
      advance: [{ type: 'manual' }, { type: 'delay', delayMs: 5000 }],
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your experience in the settings panel. This step will
            auto-advance in 5 seconds.
          </p>
        </div>
      ),
    },

    // Step 5: Completion screen
    {
      id: 'complete',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: (
        <div className="space-y-3 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-semibold">You&apos;re All Set!</h2>
          <p className="text-muted-foreground">
            You&apos;ve completed the tour. Start exploring and have fun!
          </p>
        </div>
      ),
    },
  ],
})

/**
 * Hook to easily start the onboarding flow
 */
export function useStartOnboarding() {
  const { startFlow } = React.useMemo(
    () => ({
      startFlow: (flowId: string) => {
        // This will be provided by the actual useTour hook
        console.log(`Starting flow: ${flowId}`)
      },
    }),
    [],
  )

  return () => startFlow('onboarding')
}

// Re-export for convenience
export { createFlow } from '@flowsterix/core'
