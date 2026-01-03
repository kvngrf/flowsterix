'use client'

import { createFlow } from '@flowsterix/core'
import { useTour } from '@flowsterix/headless'
import * as React from 'react'
import {
  StepContent,
  StepText,
  StepTitle,
} from '@/components/step-content'

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
export const onboardingFlow = createFlow({
  id: 'onboarding',
  version: 1,
  steps: [
    // Step 1: Welcome screen (no target, centered modal)
    {
      id: 'welcome',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent className="text-center">
          <StepTitle size="lg">Welcome to Your App! 👋</StepTitle>
          <StepText>
            Let&apos;s take a quick tour to help you get started. This will only
            take a minute.
          </StepText>
        </StepContent>
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
        <StepContent>
          <StepTitle>Navigation</StepTitle>
          <StepText>
            Use the navigation menu to move between different sections of the
            app.
          </StepText>
        </StepContent>
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
        <StepContent>
          <StepTitle>Main Feature</StepTitle>
          <StepText>
            Click this button to access the main feature. You can click it now
            or press Next to continue.
          </StepText>
        </StepContent>
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
      advance: [{ type: 'manual' }, { type: 'delay', ms: 5000 }],
      content: (
        <StepContent>
          <StepTitle>Settings</StepTitle>
          <StepText>
            Customize your experience in the settings panel. This step will
            auto-advance in 5 seconds.
          </StepText>
        </StepContent>
      ),
    },

    // Step 5: Completion screen
    {
      id: 'complete',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent className="text-center">
          <div className="text-4xl">🎉</div>
          <StepTitle size="lg">You&apos;re All Set!</StepTitle>
          <StepText>
            You&apos;ve completed the tour. Start exploring and have fun!
          </StepText>
        </StepContent>
      ),
    },
  ],
})

/**
 * Hook to easily start the onboarding flow
 */
export function useStartOnboarding() {
  const { startFlow } = useTour()

  return React.useCallback(() => startFlow('onboarding'), [startFlow])
}

// Re-export for convenience
export { createFlow } from '@flowsterix/core'
