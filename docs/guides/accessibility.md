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

## Backdrop Interaction Modes

Not every tour should freeze the UI behind it. Flowster now treats backdrop interaction as a first-class setting so you can decide whether the dimmed scrim absorbs pointer events or lets them pass through.

- Set `backdropInteraction="passthrough"` (the default) at the provider level to keep the highlight purely visual—users can continue interacting with the page even while a step is active.
- Use `backdropInteraction="block"` to turn the overlay into a modal scrim. Pointer events are trapped by the backdrop, but the punched-out highlight and popover remain interactive.

```tsx
<TourProvider flows={flows} backdropInteraction="block">
  {/* ... */}
</TourProvider>
```

When only a subset of tours should block interaction, override the default through HUD options on that flow alone:

```ts
const flow = createFlow({
  id: 'critical-setup',
  version: 1,
  hud: {
    backdrop: {
      interaction: 'block',
    },
  },
  steps: [
    /* ... */
  ],
})
```

Under the hood the overlay toggles pointer events on every backdrop layer, so you do not need extra CSS to enforce the behavior.

## Scroll Locking

When a tour step grabs the user’s attention, drifting content can be just as distracting as stray clicks. Flowster now lets you opt into body scroll locking independently of backdrop interaction modes.

- Enable it everywhere by passing `lockBodyScroll` to `TourProvider`.
- Override specific flows through `hud.behavior.lockBodyScroll` when only certain experiences need to freeze the page position.

```tsx
<TourProvider flows={flows} lockBodyScroll>
  {/* ... */}
</TourProvider>
```

```ts
const flow = createFlow({
  id: 'onboarding',
  version: 1,
  hud: {
    behavior: {
      lockBodyScroll: true,
    },
  },
  steps: [
    /* ... */
  ],
})
```

The React binding reference-counts locks, so even if multiple tours mount (or a tour re-renders) the document overflow state is restored as soon as the last lock releases.

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

## Sticky Headers & Scroll Margins

If your layout keeps a sticky header, toolbar, or product chrome pinned to the top of the viewport, default auto-scroll behavior can leave highlighted targets partially obscured. Steps can now opt into `targetBehavior.scrollMargin` to reserve extra space on specific sides of the viewport while the tour scrolls the element into view.

```ts
const flow = createFlow({
  id: 'sticky-demo',
  steps: [
    {
      id: 'feature-grid',
      target: { selector: '#feature-grid' },
      targetBehavior: {
        scrollMargin: {
          top: 96, // height of the sticky header
        },
        scrollMode: 'center',
      },
      content: <FeatureCallout />,
    },
  ],
})
```

Details:

- `scrollMargin` accepts either a single number (applied to all sides) or per-side values for `top`, `bottom`, `left`, and `right`.
- Flowster already detects nested scroll containers, so the same margin keeps targets inside overflow panels padded as they animate into view.
- The helper clamps negative values to zero and falls back to the default 16 px margin whenever a side isn’t provided.
- Add `targetBehavior.scrollMode` when you want Flowster to reposition the viewport even if the target is technically visible. Use `'start'` to pin the element just below the margin buffer, `'center'` (the default) to center it inside the available space, or `'preserve'` to keep the lighter-touch behavior that only scrolls when the element would otherwise be clipped.

In the demo app, the “Sticky Header Safe Zone” step uses this option to keep the popover just below the persistent navigation bar, making it obvious how the HUD will behave in real products.

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
