---
name: router-adapters
description: Router integration for TanStack Router, React Router, Next.js App/Pages
---

# Router Adapters

Flowsterix supports route-aware steps and advance rules. Router adapters sync the tour with your routing solution.

## TanStack Router

```tsx
import { useTanStackRouterTourAdapter } from '@flowsterix/react/router/tanstack'
import { useRouter } from '@tanstack/react-router'

function TanStackRouterSync() {
  const router = useRouter()
  useTanStackRouterTourAdapter({ router })
  return null
}

// In your app
<TourProvider flows={flows}>
  <TanStackRouterSync />
  <TourHUD />
  {children}
</TourProvider>
```

### Route-Based Steps with TanStack

```tsx
{
  id: 'dashboard-intro',
  route: '/dashboard',
  target: { selector: '[data-tour-target="stats"]' },
  advance: [{ type: 'route', to: '/settings' }],
  onResume: () => {
    // Navigate if not on correct route
    router.navigate({ to: '/dashboard' })
  },
}
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

// In your app
<BrowserRouter>
  <TourProvider flows={flows}>
    <ReactRouterSync />
    <TourHUD />
    <Routes>...</Routes>
  </TourProvider>
</BrowserRouter>
```

### Route-Based Steps with React Router

```tsx
{
  id: 'settings-tour',
  route: '/settings',
  target: { selector: '[data-tour-target="theme-toggle"]' },
  advance: [{ type: 'route', to: '/profile' }],
  onResume: () => {
    if (location.pathname !== '/settings') {
      navigate('/settings')
    }
  },
}
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

### Route-Based Steps with Next.js App Router

```tsx
{
  id: 'dashboard-widget',
  route: '/dashboard',
  target: { selector: '[data-tour-target="widget"]' },
  advance: [{ type: 'route', to: '/dashboard/settings' }],
  onResume: () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard')
    }
  },
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

### Route-Based Steps with Next.js Pages

```tsx
{
  id: 'profile-tour',
  route: '/profile',
  target: { selector: '[data-tour-target="avatar"]' },
  advance: [{ type: 'route', to: '/settings' }],
  onResume: () => {
    if (router.pathname !== '/profile') {
      router.push('/profile')
    }
  },
}
```

## Route Advance Rule Patterns

### Navigate to Specific Route

```tsx
advance: [{ type: 'route', to: '/dashboard' }]
```

Step advances when user navigates to `/dashboard`.

### Regex Route Matching

```tsx
advance: [{ type: 'route', to: /^\/dashboard\/.*/ }]
```

Advances on any route starting with `/dashboard/`.

### Any Route Change

```tsx
advance: [{ type: 'route' }]
```

Advances on any navigation.

## Complete Router Sync Example

```tsx
// tour/router-bridge.ts
import type { Router } from '@tanstack/react-router'

let tourRouter: Router<any, any> | null = null

export function setTourRouter(router: Router<any, any>) {
  tourRouter = router
}

export function getTourRouter() {
  return tourRouter
}

// tour/RouterSync.tsx
import { useRouter } from '@tanstack/react-router'
import { useTanStackRouterTourAdapter } from '@flowsterix/react/router/tanstack'
import { useEffect } from 'react'
import { setTourRouter } from './router-bridge'

export function RouterSync() {
  const router = useRouter()

  useEffect(() => {
    setTourRouter(router)
  }, [router])

  useTanStackRouterTourAdapter({ router })
  return null
}

// flows.tsx
import { getTourRouter } from './router-bridge'

const flow = createFlow({
  id: 'onboarding',
  steps: [
    {
      id: 'step-with-navigation',
      route: '/dashboard',
      target: { selector: '[data-tour-target="feature"]' },
      onResume: () => {
        const router = getTourRouter()
        if (router?.state.location.pathname !== '/dashboard') {
          router?.navigate({ to: '/dashboard' })
        }
      },
    },
  ],
})
```

## Router-Aware Step Visibility

Steps with `route` only activate when the user is on that route:

```tsx
{
  id: 'settings-step',
  route: '/settings',           // Only shows on /settings
  target: { selector: '[data-tour-target="theme"]' },
  content: <p>This step only appears on the settings page</p>,
}
```

If user is on `/dashboard`, this step is skipped automatically.
