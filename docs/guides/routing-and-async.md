# Routing & Async Integration

This guide shows how to keep Flowster tours in sync with single-page routers and how to wait for lazily rendered content before revealing a step.

## Synchronize the Tour with Your Router

The React bindings expose lightweight adapters that report navigation events into the tour runtime. Add the adapter that matches your environment inside a component that renders under `TourProvider`.

```tsx
import { TanStackRouterSync, TourProvider } from '@tour/react'

import { demoFlows } from './flows'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider flows={demoFlows} storageNamespace="flowster-demo">
      <TanStackRouterSync />
      {children}
    </TourProvider>
  )
}
```

Available adapters:

- `useTanStackRouterTourAdapter`
- `useReactRouterTourAdapter`
- `useNextAppRouterTourAdapter`
- `useNextPagesRouterTourAdapter`

Each hook reads the active location, converts it to a normalized path via `createPathString`, and passes it into the shared `routeGatingChannel`. The reusable sync components (like the `TanStackRouterSync` above) simply wrap these hooks and pad in any router-specific plumbing so your layout stays tidy.

### Custom Routers

If you use a router without a built-in adapter, call `notifyRouteChange(path)` whenever your location changes. You can also read the last known path with `getCurrentRoutePath()`.

```ts
import { notifyRouteChange } from '@tour/react'

router.subscribe((state) => {
  notifyRouteChange(state.fullPath)
})
```

## Navigating from `onResume`

When a flow resumes after the user reloads or navigates away, the previous step may belong to a different route. Use the step-level `onResume` hook to rerun any UI setup or spa navigation.

```ts
import { getTourRouter } from '@tour/react'

import { createFlow } from '@tour/core'

const flow = createFlow({
  id: 'demo-flow',
  steps: [
    {
      id: 'api-demo',
      route: '/demo/start/api-request',
      target: { selector: '[data-tour-target="api-name-item"]' },
      onResume: () => {
        const targetPath = '/demo/start/api-request'
        const router = getTourRouter()
        if (router && router.state.location.pathname !== targetPath) {
          router.navigate({ to: targetPath }).catch((error) => {
            console.warn('[tour][demo] failed to navigate', error)
          })
        }
      },
    },
  ],
})
```

Because the adapter keeps `routeGatingChannel` updated, the tour will pause rendering the HUD until navigation finishes and the target route is active.

## Route-Based Advance Rules

Use an advance rule with `type: 'route'` when a step should complete after navigation.

```ts
{
  id: 'cta',
  target: { selector: '[data-tour-target="api-link"]' },
  advance: [{ type: 'route', to: '/demo/start/api-request' }],
}
```

The rule subscribes to `routeGatingChannel` and calls `next()` once the current path matches the `to` string or regular expression. If you omit `to`, any route change satisfies the rule.

Combine the rule with `route: '/desired/path'` on the next step so the tour only mounts that step when the user reaches the expected page.

## Waiting for Async Content

Steps can opt into waiting for DOM elements or data using the `waitFor` field. The `useTourTarget` hook polls until the selector resolves or a timeout elapses, then caches the last resolved rect for smooth resume behavior.

```ts
{
  id: 'api-demo',
  route: '/demo/start/api-request',
  target: { selector: '[data-tour-target="api-name-item"]' },
  waitFor: {
    selector: '[data-tour-target="api-name-item"]',
    timeout: 8000,
  },
  content: <AsyncStepCopy />,
}
```

Key details:

- `waitFor.selector` runs alongside target resolution. The HUD stays in a `resolving` state until both the target and wait selector exist or the timeout hits.
- `waitFor.timeout` defaults to 8000 ms. When exceeded, the tour continues with the last known rect and logs a console warning to help diagnose slow render paths.
- The hook registers `MutationObserver`, `ResizeObserver`, `scroll`, and `requestAnimationFrame` listeners so the highlight adjusts as async content settles.

## Handling Missing or Hidden Targets

Sequenced UI rarely behaves perfectly—routes change, accordions collapse, and selectors drift. The HUD now surfaces a lightweight status banner inside the popover whenever the current target can’t be highlighted:

- **Looking for the target** appears when the selector hasn’t resolved yet. The popover docks to the viewport and, when possible, shows the last known position so the user can keep reading.
- **Target is hidden** triggers when the DOM node exists but has zero size or is visually hidden. Prompt users to expand the collapsed UI before advancing.
- **Target left the page** indicates the element was removed (often due to navigation). The tour pauses highlight rendering until the user returns to the expected route.

Each state is also exposed via `data-target-visibility` and `data-rect-source` attributes on `[data-tour-popover]`, so you can wire your own visual treatments or analytics when a step is operating in fallback mode.

These safeguards pair nicely with `waitFor`, route gating, and `onResume` hooks: you can keep the experience resilient without blocking progression when content isn’t instantly available.

## Troubleshooting Checklist

- **HUD opens on the wrong page:** ensure an adapter calls `notifyRouteChange` and that `onResume` handlers navigate using your router instead of `window.location`.
- **Step never resolves:** confirm the `waitFor.selector` matches the rendered markup and that it does not sit inside a portal the tour cannot observe yet.
- **Route-based rule fires early:** verify you normalize custom paths the same way as `createPathString` (leading slash, prefixed search/hash segments).
- **Delayed auto-scroll:** the target auto-scroll logic retries up to six times; if your content animates in later, combine `waitFor` with a post-animation predicate rule.
