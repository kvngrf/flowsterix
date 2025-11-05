import type { FlowDefinition } from '@tour/core'
import { createFlow } from '@tour/core'
import type { ReactNode } from 'react'

export const onboardingFlow: FlowDefinition<ReactNode> = createFlow<ReactNode>({
  id: 'demo-onboarding',
  version: 1,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      placement: 'bottom',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Welcome to Flowster
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            This short tour points out a few key areas of the demo application.
            Use Next to continue or press Skip to exit anytime.
          </p>
        </div>
      ),
    },
    {
      id: 'menu',
      target: { selector: '[data-tour-target="menu-button"]' },
      placement: 'right',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Navigation Drawer
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Open the menu to explore example routes, SSR demos, and API samples.
            The drawer is a great place to plug in contextual tour steps.
          </p>
        </div>
      ),
    },
    {
      id: 'hero',
      target: { selector: '#hero-section' },
      placement: 'bottom',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Hero Section
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            The hero highlights TanStack Start. Tours often anchor to headline
            messaging or key calls to action to help orient new users.
          </p>
        </div>
      ),
    },
    {
      id: 'feature-grid',
      target: { selector: '#feature-grid' },
      placement: 'top',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Feature Grid
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            These cards recap the major capabilities. Use tours to point
            visitors to detailed resources, documentation links, or funnel next
            steps.
          </p>
        </div>
      ),
    },
  ],
})

export const demoFlows = [onboardingFlow]
