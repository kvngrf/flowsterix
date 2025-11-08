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
      advance: [{ type: 'manual' }],
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
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Navigation Drawer
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Open the menu to explore example routes, SSR demos, and API samples.
            The drawer is a great place to plug in contextual tour steps.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Click the menu button to continue.
          </p>
        </div>
      ),
    },
    {
      id: 'ssr-toggle',
      target: { selector: '[data-tour-target="ssr-toggle"]' },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Route Groups
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Nested toggles are perfect for progressive disclosure. Here we tuck
            the SSR demos behind a secondary control.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Tap this toggle to expand the SSR demos.
          </p>
        </div>
      ),
    },
    {
      id: 'cta',
      target: { selector: '[data-tour-target="ssr-submenu"]' },
      placement: 'right',
      advance: [{ type: 'manual' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Nice Work!
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Subentries are great for organizing related routes. Let&apos;s move
            on to the feature grid.
          </p>
        </div>
      ),
    },
    {
      id: 'feature-grid',
      target: { selector: '#feature-grid' },
      placement: 'top',
      advance: [
        {
          type: 'predicate',
          pollMs: 200,
          timeoutMs: 15000,
          check: () =>
            typeof window !== 'undefined' && typeof window.scrollY === 'number'
              ? window.scrollY > 20
              : false,
        },
      ],
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
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Scroll the page a bit to continue.
          </p>
        </div>
      ),
    },
    {
      id: 'api-link',
      target: { selector: '[data-tour-target="api-link"]' },
      placement: 'right',
      advance: [{ type: 'route', to: '/demo/start/api-request' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Deeper Dives
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Tours can guide users into feature-specific routes. Let&apos;s jump
            to the API Request demo next.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Click this link—the tour will follow the navigation.
          </p>
        </div>
      ),
    },
    {
      id: 'api-demo',
      target: { selector: '[data-tour-target="api-demo-title"]' },
      placement: 'bottom',
      advance: [
        {
          type: 'predicate',
          pollMs: 200,
          timeoutMs: 8000,
          check: () =>
            typeof document !== 'undefined'
              ? document.querySelectorAll('[data-tour-target="api-name-item"]')
                  .length > 0
              : false,
        },
      ],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Data Arrived
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            We waited for the names API to resolve before advancing. Predicates
            are great for async readiness checks.
          </p>
        </div>
      ),
    },
    {
      id: 'finish',
      target: 'screen',
      controls: { back: 'hidden' },
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            That&apos;s the tour!
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            You just saw manual, event, delay, predicate, and route triggers in
            action. Add or tweak rules per step to match your onboarding flow.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Choose Finish to close or back up to revisit any step.
          </p>
        </div>
      ),
    },
  ],
})

export const demoFlows = [onboardingFlow]
