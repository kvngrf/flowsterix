# Headless React bindings

`@tour/headless` exposes the Flowster provider, hooks, router adapters, and animation utilities without shipping any HUD components or CSS. Use it when you want to render your own overlay, popover, and controls from scratch while reusing the flow runtime, targeting, and scroll management.

## Installation

```bash
pnpm add @tour/headless
```

The package depends on `@tour/core` and `@tour/react`, so those peer dependencies will be satisfied automatically in this monorepo.

## What it exports

- `TourProvider`, `useTour`, `useTourEvents`, and all of the store helpers from `@tour/react`.
- Target/geometry hooks: `useTourTarget`, `useViewportRect`, `useHiddenTargetFallback`.
- Progression helpers: `useTourControls`, `useAdvanceRules`, `useDelayAdvance`, `useBodyScrollLock`, `createWaitForPredicateController`.
- Router + animation utilities if you still want Flowster to sync with TanStack/Next/React Router or reuse the default motion adapter.

Everything that renders UI (`TourHUD`, `TourOverlay`, `TourPopover`, `DelayProgressBar`, etc.) is intentionally omitted.

## Minimal example

```tsx
import { createFlow } from '@tour/core'
import {
  TourProvider,
  useTour,
  useTourControls,
  useTourTarget,
} from '@tour/headless'
import { createPortal } from 'react-dom'

const flow = createFlow({
  id: 'headless-demo',
  version: 1,
  steps: [
    {
      id: 'hero',
      target: '#hero-section',
      content: 'Explain whatever lives in your hero section.',
      advance: [{ type: 'manual' }],
    },
    {
      id: 'cta',
      target: '#signup-button',
      content: 'Nudge the user toward your CTA.',
      advance: [{ type: 'manual' }],
    },
  ],
})

export function App() {
  return (
    <TourProvider flows={[flow]}>
      <HeadlessHud />
      {/* ...rest of your app... */}
    </TourProvider>
  )
}

function HeadlessHud() {
  const { state, activeStep, activeFlowId } = useTour()
  const target = useTourTarget()
  const controls = useTourControls()

  if (state?.status !== 'running' || !activeStep) {
    return null
  }

  const rect = target.rect ?? target.lastResolvedRect
  const highlightStyle = rect
    ? {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    : null

  return createPortal(
    <div className="headless-hud" data-flow-id={activeFlowId ?? undefined}>
      {highlightStyle ? (
        <div className="headless-highlight" style={highlightStyle} />
      ) : null}
      <div className="headless-popover">
        <p>{activeStep.content}</p>
        <div className="headless-controls">
          <button onClick={controls.goBack} disabled={!controls.canGoBack}>
            Back
          </button>
          <button onClick={controls.goNext} disabled={!controls.canGoNext}>
            Next
          </button>
          <button onClick={() => controls.cancel('headless-demo')}>Skip</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

Add your own layout, animations, and state syncing—the Flowster store handles target resolution, advancement rules, and analytics exactly like the default HUD.
