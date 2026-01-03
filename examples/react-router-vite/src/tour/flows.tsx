import type { ReactNode } from 'react'
import { createFlow } from '@flowsterix/core'
import {
  StepContent,
  StepHint,
  StepText,
  StepTitle,
} from '@/components/step-content'

export const demoFlow = createFlow<ReactNode>({
  id: 'react-router-demo',
  version: 1,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      content: (
        <StepContent>
          <StepTitle size="lg">Welcome to the React Router demo</StepTitle>
          <StepText>
            This tour highlights navigation and a routed settings panel using
            Flowsterix.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'nav',
      target: {
        selector: "[data-tour-target='nav']",
        description: 'Primary navigation',
      },
      placement: 'bottom',
      content: (
        <StepContent>
          <StepTitle>Navigation header</StepTitle>
          <StepText>
            Jump between pages while the tour keeps state in sync.
          </StepText>
          <StepHint>Click Settings to navigate, then hit Next.</StepHint>
        </StepContent>
      ),
      advance: [{ type: 'route', to: '/settings' }],
    },
    {
      id: 'settings-panel',
      route: '/settings',
      target: {
        selector: "[data-tour-target='settings-card']",
        description: 'Settings card',
      },
      placement: 'right',
      waitFor: {
        selector: "[data-tour-target='settings-card']",
        timeout: 6000,
      },
      content: (
        <StepContent>
          <StepTitle>Settings ready</StepTitle>
          <StepText>
            This step waits for the Settings route and DOM target.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
  ],
})
