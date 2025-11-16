# Accessibility Defaults

Flowster ships with opinionated accessibility support so you can keep onboarding tours inclusive without extra wiring.

## Focus Management

While a tour step is active, keyboard focus stays inside the popover and the highlighted target. Tabbing cycles through the popover controls first, then any focusable elements inside the current target. When the tour closes, focus returns to wherever it started.

If you need to exclude an element from the trap, add `data-tour-focus-skip="true"` anywhere in its ancestor chain. This is useful for decorative buttons or utility controls that should remain reachable by screen readers but not considered part of the interaction loop.

Target descriptions (`target.description`) are announced via an off-screen description that is referenced by the popover’s `aria-describedby`, so users get context about what the highlight represents.

## Popover Roles and Labels

Popover dialogs use `role="dialog"` by default with `aria-modal="false"` so users can still interact with the highlighted area. You can override or extend the ARIA metadata through HUD popover options:

```ts
const flow = createFlow({
  id: 'guided-demo',
  version: 1,
  hud: {
    popover: {
      role: 'dialog',
      ariaLabel: 'Guided onboarding step',
      ariaDescribedBy: 'tour-extra-description',
      ariaModal: false,
    },
  },
  steps: [
    /* ... */
  ],
})
```

Add matching IDs inside your content when you need a custom description, or rely on `target.description` for a quick annotation.

## Hidden Target Fallbacks

Sometimes a step’s element technically exists but is collapsed to `display: none`, zero width/height, or otherwise hidden from assistive tech. Flowster watches for that state and, after a short grace period (900&nbsp;ms by default), either centers the HUD on the screen or silently skips to the next step.

Control the behavior per step with `targetBehavior`:

```ts
const flow = createFlow({
  id: 'guided-demo',
  version: 1,
  steps: [
    {
      id: 'filters',
      target: { selector: '#filters-panel' },
      targetBehavior: {
        hidden: 'screen', // default – center popover as a screen modal
        hiddenDelayMs: 600,
      },
      content: <FiltersStep />,
    },
    {
      id: 'beta-only',
      target: { selector: '#beta-badge' },
      targetBehavior: {
        hidden: 'skip', // auto-advance instead of blocking the flow
        hiddenDelayMs: 800,
      },
      content: <BetaBadgeStep />,
    },
  ],
})
```

`hidden: 'screen'` shows a centered modal fallback while keeping the flow alive, and `'skip'` advances (or completes) the tour once the delay expires. The default delay keeps things calm during quick UI transitions but you can lower it when you know the visibility change is intentional.

## Reduced Motion

`TourProvider` now auto-detects `prefers-reduced-motion` by default and swaps to the `reducedMotionAnimationAdapter`. You can still opt out or provide a custom adapter:

```tsx
<TourProvider
  flows={flows}
  autoDetectReducedMotion={false}
  animationAdapter={brandAdapter}
  reducedMotionAdapter={fallbackAdapter}
>
  {/* ... */}
</TourProvider>
```

Keep `autoDetectReducedMotion` enabled unless you have a very specific reason to manage motion preferences yourself.

## Restoring Focus

When the tour ends or pauses, keyboard focus returns to the element that was active beforehand. If that element disappears during the tour, Flowster simply leaves focus where it is—avoiding confusing jumps.

These defaults aim to cover most accessibility needs out of the box. For additional requirements, reach out via issues or extend the components—every piece is built with customisation in mind.
