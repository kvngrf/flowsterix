import type { FlowDefinition } from '@tour/core'
import { createFlow } from '@tour/core'
import { DelayProgressBar, useDelayAdvance } from '@tour/react'
import type { ReactNode } from 'react'

const DelayCountdownLabel = () => {
  const { remainingMs, totalMs, flowId } = useDelayAdvance()

  if (!flowId || totalMs <= 0) {
    return null
  }

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))

  return (
    <p
      style={{
        margin: 0,
        lineHeight: 1.5,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      Advancing automatically in <strong>{seconds}s</strong>
    </p>
  )
}

const DelayDemoContent = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
      Automatic Advance
    </h2>
    <p style={{ margin: 0, lineHeight: 1.5 }}>
      Delay rules move to the next step after a timer expires. Use the{' '}
      <code style={{ paddingLeft: 4, paddingRight: 4 }}>useDelayAdvance</code>{' '}
      hook to present your own countdown, or drop in the default progress bar
      below.
    </p>
    <DelayProgressBar />
    <DelayCountdownLabel />
    <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
      You can also use{' '}
      <code style={{ paddingLeft: 4, paddingRight: 4 }}>useDelayAdvance</code>{' '}
      inside custom UI to pause, react to, or format the remaining time however
      fits your product.
    </p>
  </div>
)

export const onboardingFlow: FlowDefinition<ReactNode> = createFlow<ReactNode>({
  id: 'demo-onboarding',
  version: 1,
  hud: {
    popover: {
      offset: 28,
    },
    overlay: {
      blur: 6,
      shadow:
        'inset 0 0 0 2px rgba(56,189,248,0.45), inset 0 0 0 12px rgba(15,23,42,0.28)',
    },
  },
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
      id: 'auto-advance-demo',
      target: { selector: '[data-tour-target="ssr-submenu"]' },
      placement: 'right',
      advance: [{ type: 'delay', ms: 5000 }],
      controls: { next: 'hidden' },
      content: <DelayDemoContent />,
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
      route: '/demo/start/api-request',
      target: { selector: '[data-tour-target="api-name-item"]' },
      waitFor: {
        selector: '[data-tour-target="api-name-item"]',
        timeout: 8000,
      },
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Async Target Ready
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            We waited until the names API rendered a list item before showing
            this step. The{' '}
            <code style={{ paddingLeft: 4, paddingRight: 4 }}>waitFor</code>{' '}
            selector blocks the HUD until the element exists in the DOM.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Once the data loads, review the highlighted name then continue.
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
