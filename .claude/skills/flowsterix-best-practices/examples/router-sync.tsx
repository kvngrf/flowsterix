/**
 * Router Sync Example
 *
 * Shows integration patterns for all supported routers.
 */

// =============================================================================
// TanStack Router
// =============================================================================

import { useTanStackRouterTourAdapter } from '@flowsterix/react/router/tanstack'
import { useRouter } from '@tanstack/react-router'

export function TanStackRouterSync() {
  const router = useRouter()
  useTanStackRouterTourAdapter({ router })
  return null
}

// Router bridge for use in flow definitions
let tanstackRouter: ReturnType<typeof useRouter> | null = null

export function setTanStackRouter(router: ReturnType<typeof useRouter>) {
  tanstackRouter = router
}

export function getTanStackRouter() {
  return tanstackRouter
}

// Hook to set up the bridge
export function useTanStackRouterBridge() {
  const router = useRouter()
  useEffect(() => {
    setTanStackRouter(router)
  }, [router])
  useTanStackRouterTourAdapter({ router })
  return null
}

// =============================================================================
// React Router v6
// =============================================================================

import { useReactRouterTourAdapter } from '@flowsterix/react/router/react-router'
import { useNavigate, useLocation } from 'react-router-dom'

export function ReactRouterSync() {
  const navigate = useNavigate()
  const location = useLocation()
  useReactRouterTourAdapter({ navigate, location })
  return null
}

// =============================================================================
// Next.js App Router
// =============================================================================

import { useNextAppRouterTourAdapter } from '@flowsterix/react/router/next-app'
import { usePathname, useRouter as useNextRouter } from 'next/navigation'
import { Suspense } from 'react'

function NextAppRouterSyncInner() {
  const pathname = usePathname()
  const router = useNextRouter()
  useNextAppRouterTourAdapter({ pathname, router })
  return null
}

export function NextAppRouterSync() {
  return (
    <Suspense fallback={null}>
      <NextAppRouterSyncInner />
    </Suspense>
  )
}

// =============================================================================
// Next.js Pages Router
// =============================================================================

import { useNextPagesRouterTourAdapter } from '@flowsterix/react/router/next-pages'
import { useRouter as useNextPagesRouter } from 'next/router'

export function NextPagesRouterSync() {
  const router = useNextPagesRouter()
  useNextPagesRouterTourAdapter({ router })
  return null
}

// =============================================================================
// Flow with route-based steps
// =============================================================================

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

export const routeAwareFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'route-demo',
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: 'home-intro',
      route: '/',
      target: { selector: '[data-tour-target="hero"]' },
      advance: [{ type: 'manual' }],
      content: <p>Welcome to the home page!</p>,
    },

    {
      id: 'navigate-to-dashboard',
      route: '/',
      target: { selector: '[data-tour-target="dashboard-link"]' },
      advance: [{ type: 'route', to: '/dashboard' }],
      content: <p>Click this link to go to the dashboard.</p>,
    },

    {
      id: 'dashboard-intro',
      route: '/dashboard',
      target: { selector: '[data-tour-target="stats-panel"]' },
      waitFor: {
        selector: '[data-tour-target="stats-panel"]',
        timeout: 5000,
      },
      advance: [{ type: 'manual' }],
      onResume: () => {
        // Navigate to dashboard if user resumed on wrong page
        const router = getTanStackRouter()
        if (router?.state.location.pathname !== '/dashboard') {
          router?.navigate({ to: '/dashboard' })
        }
      },
      content: <p>Here's your dashboard overview.</p>,
    },

    {
      id: 'settings-feature',
      route: /^\/settings/,
      target: { selector: '[data-tour-target="theme-toggle"]' },
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      onResume: () => {
        const router = getTanStackRouter()
        if (!router?.state.location.pathname.startsWith('/settings')) {
          router?.navigate({ to: '/settings' })
        }
      },
      content: <p>Toggle the theme here.</p>,
    },
  ],
})

// =============================================================================
// Usage Examples
// =============================================================================

// TanStack Router App
export function TanStackApp({ children }: { children: ReactNode }) {
  return (
    <TourProvider flows={[routeAwareFlow]}>
      <TanStackRouterSync />
      <TourHUD />
      {children}
    </TourProvider>
  )
}

// React Router App
export function ReactRouterApp({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <TourProvider flows={[routeAwareFlow]}>
        <ReactRouterSync />
        <TourHUD />
        {children}
      </TourProvider>
    </BrowserRouter>
  )
}

// Next.js App Router (in layout.tsx)
export function NextAppLayout({ children }: { children: ReactNode }) {
  return (
    <TourProvider flows={[routeAwareFlow]}>
      <NextAppRouterSync />
      <TourHUD />
      {children}
    </TourProvider>
  )
}

// Next.js Pages Router (in _app.tsx)
export function NextPagesApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentType
  pageProps: Record<string, unknown>
}) {
  return (
    <TourProvider flows={[routeAwareFlow]}>
      <NextPagesRouterSync />
      <TourHUD />
      <Component {...pageProps} />
    </TourProvider>
  )
}

import { TourHUD, TourProvider } from '@flowsterix/react'
import { BrowserRouter } from 'react-router-dom'
