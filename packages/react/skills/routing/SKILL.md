---
name: routing
description: Route gating, router adapters, and route-based step patterns for Flowsterix. Use when integrating tours with TanStack Router, React Router, Next.js App Router, or Next.js Pages Router, or when creating route-dependent tour steps.
metadata:
  sources:
    - docs/guides/routing-and-async.md
---

# Routing

Flowsterix supports route-aware steps and advance rules. Router adapters sync the tour with your routing solution.

## Route Gating

Steps can be constrained to specific routes. The flow automatically pauses when the user navigates away and resumes when they return.

```tsx
{
  id: 'dashboard-feature',
  target: { selector: '[data-tour-target="widget"]' },
  route: '/dashboard',
  content: <p>This widget shows your stats</p>,
}
```

**When user navigates away from `/dashboard`:**
1. Flow **pauses** immediately (overlay disappears)
2. User can browse other pages freely
3. When user returns to `/dashboard`, flow **auto-resumes**

### Route Patterns

```tsx
route: '/dashboard'             // Exact match
route: /^\/users\/\d+$/         // Regex pattern
route: /^\/products\/[^/]+$/    // Path parameters via regex
```

### Missing Target Behavior (No Route Defined)

When a step has **no `route` property** and the target element is missing:
1. Grace period (400ms) - Allows async elements to mount
2. If still missing → Flow pauses
3. When user navigates to a different page → Flow resumes and re-checks
4. If target found → Flow continues
5. If still missing → Grace period → Pause again

## TanStack Router

```tsx
import { useTanStackRouterTourAdapter } from '@flowsterix/react/router/tanstack'
import { useRouter } from '@tanstack/react-router'

function TanStackRouterSync() {
  const router = useRouter()
  useTanStackRouterTourAdapter({ router })
  return null
}

<TourProvider flows={flows}>
  <TanStackRouterSync />
  <TourHUD />
  {children}
</TourProvider>
```

### Router Bridge Pattern (TanStack)

Access the router instance in flow definitions (outside React):

```tsx
// tour/router-bridge.ts
import type { Router } from '@tanstack/react-router'

let tourRouter: Router<any, any> | null = null
export function setTourRouter(router: Router<any, any>) { tourRouter = router }
export function getTourRouter() { return tourRouter }

// tour/RouterSync.tsx
import { useRouter } from '@tanstack/react-router'
import { useTanStackRouterTourAdapter } from '@flowsterix/react/router/tanstack'
import { useEffect } from 'react'
import { setTourRouter } from './router-bridge'

export function RouterSync() {
  const router = useRouter()
  useEffect(() => { setTourRouter(router) }, [router])
  useTanStackRouterTourAdapter({ router })
  return null
}

// flows.tsx
import { getTourRouter } from './router-bridge'

const flow = createFlow({
  steps: [{
    id: 'dashboard',
    route: '/dashboard',
    target: { selector: '[data-tour-target="feature"]' },
    onResume: () => {
      const router = getTourRouter()
      if (router?.state.location.pathname !== '/dashboard') {
        router?.navigate({ to: '/dashboard' })
      }
    },
  }],
})
```

## React Router v6

```tsx
import { useReactRouterTourAdapter } from '@flowsterix/react/router/react-router'
import { useNavigate, useLocation } from 'react-router-dom'

function ReactRouterSync() {
  const navigate = useNavigate()
  const location = useLocation()
  useReactRouterTourAdapter({ navigate, location })
  return null
}

<BrowserRouter>
  <TourProvider flows={flows}>
    <ReactRouterSync />
    <TourHUD />
    <Routes>...</Routes>
  </TourProvider>
</BrowserRouter>
```

## Next.js App Router

```tsx
'use client'

import { useNextAppRouterTourAdapter } from '@flowsterix/react/router/next-app'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function RouterSync() {
  const pathname = usePathname()
  const router = useRouter()
  useNextAppRouterTourAdapter({ pathname, router })
  return null
}

// Wrap in Suspense for Next.js App Router
export function NextRouterSync() {
  return (
    <Suspense fallback={null}>
      <RouterSync />
    </Suspense>
  )
}

// In layout.tsx
export default function RootLayout({ children }) {
  return (
    <TourProvider flows={flows}>
      <NextRouterSync />
      <TourHUD />
      {children}
    </TourProvider>
  )
}
```

## Next.js Pages Router

```tsx
import { useNextPagesRouterTourAdapter } from '@flowsterix/react/router/next-pages'
import { useRouter } from 'next/router'

function NextPagesRouterSync() {
  const router = useRouter()
  useNextPagesRouterTourAdapter({ router })
  return null
}

// In _app.tsx
export default function App({ Component, pageProps }) {
  return (
    <TourProvider flows={flows}>
      <NextPagesRouterSync />
      <TourHUD />
      <Component {...pageProps} />
    </TourProvider>
  )
}
```

## Route Advance Rules

```tsx
// Advance when user navigates to specific route
advance: [{ type: 'route', to: '/dashboard' }]

// Regex matching
advance: [{ type: 'route', to: /^\/dashboard\/.*/ }]

// Any route change
advance: [{ type: 'route' }]
```

## Route-Aware Resume

Always implement `onResume` for route-dependent steps to handle page reload:

```tsx
{
  id: 'settings-tour',
  route: '/settings',
  target: { selector: '[data-tour-target="theme-toggle"]' },
  onResume: () => {
    if (location.pathname !== '/settings') {
      navigate('/settings')
    }
  },
}
```
