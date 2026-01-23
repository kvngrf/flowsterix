'use client'

import { StepContent, StepText, StepTitle } from '@/components/step-content'
import { createFlow } from '@flowsterix/core'
import type { ReactNode } from 'react'

export const demoFlow = createFlow<ReactNode>({
  id: 'next-demo',
  version: { major: 1, minor: 0 },
  autoStart: true,
  steps: [
    {
      id: 'intro',
      target: 'screen',
      content: (
        <StepContent>
          <StepTitle size="lg">Next.js App Router tour</StepTitle>
          <StepText>
            Flowsterix can follow you across pages and layouts.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'header',
      target: {
        selector: "[data-tour-target='header']",
        description: 'Header navigation',
      },
      placement: 'bottom',
      content: (
        <StepContent>
          <StepTitle>Navigation stays in sync</StepTitle>
          <StepText>Click Settings to move to the next step.</StepText>
        </StepContent>
      ),
      advance: [{ type: 'route', to: '/settings' }],
    },
    {
      id: 'settings',
      route: '/settings',
      target: {
        selector: "[data-tour-target='settings-panel']",
        description: 'Settings panel',
      },
      placement: 'right',
      waitFor: {
        selector: "[data-tour-target='settings-panel']",
        timeout: 6000,
      },
      content: (
        <StepContent>
          <StepTitle>Settings ready</StepTitle>
          <StepText>
            The tour resumes when the routed content is available.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
  ],
})
