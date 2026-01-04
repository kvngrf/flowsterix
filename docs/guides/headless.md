# Headless React bindings

`@flowsterix/react` exposes the Flowsterix provider, hooks, router adapters, and animation utilities without shipping any HUD components or CSS. Use it when you want to render your own overlay, popover, and controls from scratch while reusing the flow runtime, targeting, and scroll management.

## Installation

```bash
pnpm add @flowsterix/react
```

The bindings depend on `@flowsterix/core`, so the workspace will wire that automatically in this monorepo.

## What it exports

- `TourProvider`, `useTour`, `useTourEvents`, and all of the store helpers from `@flowsterix/react`.
- Target/geometry hooks: `useTourTarget`, `useViewportRect`, `useHiddenTargetFallback`.
- Progression helpers: `useTourControls`, `useAdvanceRules`, `useDelayAdvance`, `useBodyScrollLock`, `createWaitForPredicateController`.
- HUD hooks: `useTourHud` for the bundled experience, `useTourOverlay` for reusable highlight geometry, plus the lower-level `useHudState`, `useHudDescription`, `useHudShortcuts`, `useHudTargetIssue` when you need to pick and choose pieces.
- Visual primitives: `OverlayBackdrop`, the same component Flowsterix uses under the hood for `TourOverlay`, which renders the mask/backdrop/interaction blocker using the data from `useTourOverlay`.
- Router + animation utilities if you still want Flowsterix to sync with TanStack/Next/React Router or reuse the default motion adapter.

Everything that renders UI (`TourHUD`, `TourOverlay`, `TourPopover`, `DelayProgressBar`, etc.) is intentionally omitted.

## Minimal example

```tsx
import { createFlow } from '@flowsterix/core'
import {
  TourProvider,
  useTour,
  useTourControls,
  useTourTarget,
} from '@flowsterix/react'
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

Add your own layout, animations, and state syncing—the Flowsterix store handles target resolution, advancement rules, and analytics exactly like the default HUD.

> **Heads up:** set `hud.render = 'none'` (as shown above) on any flow you plan to drive with your own HUD. Otherwise any shadcn HUD you render will show alongside your custom UI.

## HUD helper hooks in practice

```tsx
import {
  TourFocusManager,
  TourPopoverPortal,
  useTourHud,
} from '@flowsterix/react'

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

`useTourHud` mirrors the behavior of Flowsterix's default HUD—body scroll locking, keyboard shortcuts, focus management, description wiring, and target diagnostics all stay in sync. You can still reach for the lower-level hooks if you need to override any particular piece.

## Overlay helpers

Need the highlight math without recreating Flowsterix's overlay logic? Call `useTourOverlay` with the active `hudTarget` and feed that data into the new `OverlayBackdrop` component. It renders the same mask/backdrop/interaction-blocker stack used by the default HUD, but you can fully customize color, blur, and transitions:

```tsx
import {
  OverlayBackdrop,
  useTourHud,
  useTourOverlay,
} from '@flowsterix/react'

function HighlightOverlay() {
  const hud = useTourHud()
  const overlay = useTourOverlay({
    target: hud.hudState.hudTarget,
    padding: hud.overlay.padding,
    radius: hud.overlay.radius,
    interactionMode: hud.overlay.interactionMode,
  })

  return (
    <OverlayBackdrop
      overlay={overlay}
      zIndex={2000}
      color="rgba(2,6,23,0.65)"
      blurAmount={10}
      shadow="0 0 0 2px rgba(82,255,168,0.9), 0 0 70px rgba(82,255,168,0.45)"
      transitionsOverride={{
        overlayFade: { duration: 0.25, ease: 'easeOut' },
        overlayHighlight: { type: 'spring', stiffness: 260, damping: 25 },
      }}
      ariaHidden={overlay.highlight.target?.status !== 'ready'}
    />
  )
}
```

`OverlayBackdrop` understands the fallback segments, pointer-blocker rectangles, mask IDs, and highlight caching provided by `useTourOverlay`, so you get the resilient behavior of `TourOverlay` without copying its internals. Want even more control? You can still read directly from `overlay.highlight`, `overlay.fallbackSegments`, etc., but now most headless HUDs only need a couple of props to replicate the built-in visuals.
