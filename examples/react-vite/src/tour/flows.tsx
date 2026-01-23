import type { FlowDefinition } from '@flowsterix/core'
import { createFlow } from '@flowsterix/core'
import type { ReactNode } from 'react'

import { DelayProgressBar } from '@/components/delay-progress-bar'
import {
  StepContent,
  StepHint,
  StepText,
  StepTitle,
} from '@/components/step-content'
import { useDelayAdvance } from '@/hooks/use-tour'

import { getTourRouter } from './routerBridge'

const STICKY_HEADER_OFFSET = 96

const DelayCountdownLabel = () => {
  const { remainingMs, totalMs, flowId } = useDelayAdvance()

  if (!flowId || totalMs <= 0) {
    return null
  }

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))

  return (
    <StepText className="text-foreground tabular-nums">
      Advancing automatically in <strong>{seconds}s</strong>
    </StepText>
  )
}

const DelayDemoContent = () => (
  <StepContent>
    <StepTitle>Automatic Advance</StepTitle>
    <StepText>
      Delay rules move to the next step after a timer expires. Use the{' '}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
        useDelayAdvance
      </code>{' '}
      hook to present your own countdown, or drop in the default progress bar
      below.
    </StepText>
    <DelayProgressBar />
    <DelayCountdownLabel />
    <StepHint>
      You can also use{' '}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
        useDelayAdvance
      </code>{' '}
      inside custom UI to pause, react to, or format the remaining time however
      fits your product.
    </StepHint>
  </StepContent>
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

const ensureMenuClosed = () => {
  if (typeof document === 'undefined') return
  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return
  const isClosed = panel.classList.contains('-translate-x-full')
  if (isClosed) return
  // Click the close button inside the panel, not the menu-button (which only opens)
  const closeButton = panel.querySelector('[aria-label="Close menu"]')
  if (closeButton instanceof HTMLElement) {
    closeButton.click()
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
  // hud: {
  //   render: 'none',
  // },
  autoStart: true,
  resumeStrategy: 'current',
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle size="lg">Welcome to Flowsterix</StepTitle>
          <StepText>
            This short tour points out a few key areas of the demo application.
            Use Next to continue or press Skip to exit anytime.
          </StepText>
        </StepContent>
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
      onResume: () => ensureMenuClosed(),
      content: (
        <StepContent>
          <StepTitle>Navigation Drawer</StepTitle>
          <StepText>
            Open the menu to explore example routes, SSR demos, and API samples.
            The drawer is a great place to plug in contextual tour steps.
          </StepText>
          <StepHint>Click the menu button to continue.</StepHint>
        </StepContent>
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
      onResume: () => {
        ensureMenuOpen()
        ensureSsrGroupExpanded()
      },
      content: (
        <StepContent>
          <StepTitle>Route Groups</StepTitle>
          <StepText>
            Nested toggles are perfect for progressive disclosure. Here we tuck
            the SSR demos behind a secondary control.
          </StepText>
          <StepHint>Tap this toggle to expand the SSR demos.</StepHint>
        </StepContent>
      ),
    },
    {
      id: 'cta',
      target: {
        selector: '[data-tour-target="ssr-submenu"]',
        description: 'SSR examples submenu links',
      },
      onResume: () => {
        ensureMenuOpen()
        ensureSsrGroupExpanded()
      },
      placement: 'right',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle>Nice Work!</StepTitle>
          <StepText>
            Subentries are great for organizing related routes. Let&apos;s move
            on to the feature grid.
          </StepText>
        </StepContent>
      ),
    },
    {
      id: 'auto-advance-demo',
      target: {
        selector: '[data-tour-target="ssr-submenu"]',
        description: 'SSR examples submenu links',
      },
      onResume: () => {
        ensureMenuOpen()
        ensureSsrGroupExpanded()
      },
      onEnter: () => {
        ensureMenuOpen()
        ensureSsrGroupExpanded()
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
      targetBehavior: {
        scrollMargin: { top: STICKY_HEADER_OFFSET },
        scrollMode: 'center',
      },
      onEnter: () => {
        setTimeout(() => ensureMenuClosed(), 0)
      },
      onResume: () => ensureMenuClosed(),
      placement: 'top',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle>Feature Grid</StepTitle>
          <StepText>
            These cards recap the major capabilities. Use tours to point
            visitors to detailed resources, documentation links, or funnel next
            steps.
          </StepText>
        </StepContent>
      ),
    },
    {
      id: 'sticky-cta',
      target: {
        selector: '#sticky-cta-card',
        description: 'Deep dive tile positioned below the fold',
      },
      targetBehavior: {
        scrollMargin: { top: STICKY_HEADER_OFFSET + 16 },
        scrollMode: 'start',
      },
      placement: 'top',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle>Sticky Header Safe Zone</StepTitle>
          <StepText>
            Notice how the highlight stops just beneath the navigation bar even
            though it is sticky. The new{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              scrollMargin
            </code>{' '}
            option keeps targets from hiding behind persistent chrome.
          </StepText>
          <StepHint>Use Next when you&apos;re ready to continue.</StepHint>
        </StepContent>
      ),
    },
    {
      id: 'api-link',
      target: {
        selector: '[data-tour-target="api-link"]',
        description: 'Link to the API request demo route',
      },
      placement: 'right',
      onEnter: () => ensureMenuOpen(),
      onResume: () => ensureMenuOpen(),
      onExit: () => ensureMenuClosed(),
      advance: [{ type: 'route', to: '/demo/start/api-request' }],
      content: (
        <StepContent>
          <StepTitle>Deeper Dives</StepTitle>
          <StepText>
            Tours can guide users into feature-specific routes. Let&apos;s jump
            to the API Request demo next.
          </StepText>
          <StepHint>
            Click this link—the tour will follow the navigation.
          </StepHint>
        </StepContent>
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
        <StepContent>
          <StepTitle>Async Target Ready</StepTitle>
          <StepText>
            We waited until the names API rendered a list item before showing
            this step. The{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              waitFor
            </code>{' '}
            selector blocks the HUD until the element exists in the DOM.
          </StepText>
          <StepHint>
            Once the data loads, review the highlighted name then continue.
          </StepHint>
        </StepContent>
      ),
    },
    {
      id: 'finish',
      target: 'screen',
      controls: { back: 'hidden' },
      placement: 'bottom',
      advance: [{ type: 'manual' }],
      content: (
        <StepContent>
          <StepTitle size="lg">That&apos;s the tour!</StepTitle>
          <StepText>
            You just saw manual, event, delay, predicate, and route triggers in
            action. Add or tweak rules per step to match your onboarding flow.
          </StepText>
          <StepHint>
            Choose Finish to close or back up to revisit any step.
          </StepHint>
        </StepContent>
      ),
    },
  ],
})

export const demoFlows = [onboardingFlow]
