import type { FlowDefinition } from '@tour/core'
import { createFlow } from '@tour/core'
import { DelayProgressBar, getTourRouter, useDelayAdvance } from '@tour/react'
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

const ensureMenuOpen = () => {
  if (typeof document === 'undefined') return
  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return
  const isClosed = panel.classList.contains('-translate-x-full')
  if (!isClosed) return
  const trigger = document.querySelector('[data-tour-target="menu-button"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
  }
}

const ensureSsrGroupExpanded = () => {
  if (typeof document === 'undefined') return
  ensureMenuOpen()
  const submenu = document.querySelector('[data-tour-target="ssr-submenu"]')
  if (submenu) return
  const toggle = document.querySelector('[data-tour-target="ssr-toggle"]')
  if (toggle instanceof HTMLElement) {
    toggle.click()
  }
}

export const onboardingFlow: FlowDefinition<ReactNode> = createFlow<ReactNode>({
  id: 'demo-onboarding',
  version: 1,
  hud: {
    popover: {
      offset: 28,
    },
    overlay: {
      blur: 6,
      shadow: 'inset 0 0 0 2px rgba(56,189,248,0.45)',
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
      target: {
        selector: '[data-tour-target="menu-button"]',
        description: 'Navigation menu toggle button',
      },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      onResume: () => ensureMenuOpen(),
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
      target: {
        selector: '[data-tour-target="ssr-toggle"]',
        description: 'SSR examples accordion toggle',
      },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      onResume: () => ensureSsrGroupExpanded(),
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
      target: {
        selector: '[data-tour-target="ssr-submenu"]',
        description: 'SSR examples submenu links',
      },
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
      target: {
        selector: '[data-tour-target="ssr-submenu"]',
        description: 'SSR examples submenu links',
      },
      placement: 'right',
      advance: [{ type: 'delay', ms: 2000 }],
      content: <DelayDemoContent />,
    },
    {
      id: 'feature-grid',
      target: {
        selector: '#feature-grid',
        description: 'Feature highlight card grid',
      },
      placement: 'top',
      advance: [{ type: 'event', event: 'keydown', on: 'document' }],
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
            Press a keyboard key to continue.
          </p>
        </div>
      ),
    },
    {
      id: 'api-link',
      target: {
        selector: '[data-tour-target="api-link"]',
        description: 'Link to the API request demo route',
      },
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
      target: {
        selector: '[data-tour-target="api-name-item"]',
        description: 'First result rendered by the names API demo',
      },
      waitFor: {
        selector: '[data-tour-target="api-name-item"]',
        timeout: 8000,
      },
      onResume: () => {
        const targetPath = '/demo/start/api-request'
        const router = getTourRouter()

        if (router) {
          const currentPath = router.state.location.pathname
          if (currentPath === targetPath) {
            return
          }
          router.navigate({ to: targetPath }).catch((error: unknown) => {
            console.warn('[tour][demo] failed to navigate', error)
          })
          return
        }

        if (typeof window === 'undefined') {
          return
        }
        if (window.location.pathname === targetPath) {
          return
        }
        window.location.assign(targetPath)
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
