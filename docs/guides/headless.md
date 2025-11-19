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
- HUD hooks: `useTourHud` for the bundled experience, `useTourOverlay` for reusable highlight geometry, plus the lower-level `useHudState`, `useHudAppearance`, `useHudDescription`, `useHudShortcuts`, `useHudTargetIssue` when you need to pick and choose pieces.
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
  hud: {
    render: 'none',
  },
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

> **Heads up:** set `hud.render = 'none'` (as shown above) on any flow you plan to drive with your own HUD. Otherwise the built-in `TourHUD` will render alongside your custom UI.

## HUD helper hooks in practice

```tsx
import { TourFocusManager, TourPopoverPortal, useTourHud } from '@tour/headless'

function HeadlessHud() {
  const hud = useTourHud({ overlayRadius: 24 })
  const { hudState, popover, description, focusManager, targetIssue } = hud

  if (!hudState.shouldRender || !hudState.runningStep) return null

  return (
    <>
      <TourFocusManager
        active={focusManager.active}
        target={focusManager.target}
        popoverNode={focusManager.popoverNode}
      />
      <TourPopoverPortal
        target={hudState.hudTarget}
        offset={popover.offset}
        ariaLabel={popover.ariaLabel}
        ariaDescribedBy={description.combinedAriaDescribedBy}
        descriptionId={description.descriptionId}
        descriptionText={description.text ?? undefined}
        onContainerChange={focusManager.setPopoverNode}
      >
        {targetIssue.issue ? (
          <p data-target-issue>{targetIssue.issue.title}</p>
        ) : null}
        {hudState.runningStep.content}
      </TourPopoverPortal>
    </>
  )
}
```

`useTourHud` mirrors the behavior of Flowster’s default HUD—body scroll locking, keyboard shortcuts, focus management, description wiring, and target diagnostics all stay in sync. You can still reach for the lower-level hooks if you need to override any particular piece.

## Overlay helper hook

Need the highlight math without recreating Flowster’s overlay logic? Call `useTourOverlay` with the active `hudTarget` and reuse the returned rect to paint your own mask:

```tsx
import { useTourHud, useTourOverlay } from '@tour/headless'

function HighlightOverlay() {
  const hud = useTourHud()
  const overlay = useTourOverlay({
    target: hud.hudState.hudTarget,
    padding: hud.overlay.padding,
    radius: hud.overlay.radius,
    interactionMode: hud.overlay.interactionMode,
  })

  if (!overlay.highlight.rect) {
    return overlay.showBaseOverlay ? (
      <div className="fixed inset-0 bg-black/60" aria-hidden />
    ) : null
  }

  const rect = overlay.highlight.rect

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: rect.radius,
        boxShadow: '0 0 0 9999px rgba(2,6,23,0.65)',
        backgroundClip: 'padding-box',
      }}
    />
  )
}
```

The hook mirrors `TourOverlay`’s resilient behavior: it caches the last known target, clamps the highlight when the element hugs the viewport edge, and tells you when to fall back to a full-screen scrim if the real target hasn’t mounted yet.
