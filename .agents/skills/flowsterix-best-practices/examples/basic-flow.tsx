/**
 * Basic Flow Example
 *
 * A simple 3-step onboarding tour demonstrating core Flowsterix patterns.
 */

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import { TourHUD, TourProvider } from '@flowsterix/react'
import type { ReactNode } from 'react'

// Step content components (create your own or use shadcn registry)
function StepContent({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

function StepText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

// Define the flow
export const onboardingFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'onboarding',
  version: { major: 1, minor: 0 },
  autoStart: true,
  resumeStrategy: 'current',
  steps: [
    // Step 1: Welcome screen (no element highlight)
    {
      id: 'welcome',
      target: 'screen',
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle>Welcome to Our App!</StepTitle>
          <StepText>
            This quick tour will show you the main features.
            Click Next to continue or Skip to exit anytime.
          </StepText>
        </StepContent>
      ),
    },

    // Step 2: Highlight a specific element
    {
      id: 'main-feature',
      target: {
        selector: '[data-tour-target="main-feature"]',
        description: 'Primary feature button',
      },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: (
        <StepContent>
          <StepTitle>Try This Feature</StepTitle>
          <StepText>
            Click this button to see what happens.
            The tour will advance automatically.
          </StepText>
        </StepContent>
      ),
    },

    // Step 3: Completion
    {
      id: 'finish',
      target: 'screen',
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      controls: { back: 'hidden' },
      content: (
        <StepContent>
          <StepTitle>You're All Set!</StepTitle>
          <StepText>
            You've completed the tour. Explore the app on your own
            or revisit this tour from the help menu.
          </StepText>
        </StepContent>
      ),
    },
  ],
})

// App setup
export function App({ children }: { children: ReactNode }) {
  return (
    <TourProvider
      flows={[onboardingFlow]}
      storageNamespace="my-app"
      persistOnChange={true}
    >
      <TourHUD
        overlay={{ showRing: true, padding: 12 }}
        controls={{ showSkip: true }}
        progress={{ show: true, variant: 'dots' }}
      />
      {children}
    </TourProvider>
  )
}

// Example component with tour target
export function MainFeature() {
  return (
    <button
      data-tour-target="main-feature"
      className="px-4 py-2 bg-primary text-primary-foreground rounded"
    >
      Click Me
    </button>
  )
}
