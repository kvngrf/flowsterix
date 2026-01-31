# Accessibility Defaults

Flowsterix ships with opinionated accessibility support so you can keep onboarding tours inclusive without extra wiring.

## Focus Management

While a tour step is active, keyboard focus stays inside the popover and the highlighted target. Flowsterix inserts two hidden focus guards around the target and two around the popover to preserve native tabbing while keeping focus trapped. This keeps `:focus-visible` styles consistent while still allowing keyboard users to reach both regions. When the tour closes, focus returns to wherever it started.

When a step targets `screen` (no element), Flowsterix falls back to a popover-only loop: the popover guards wrap to each other so focus never leaves the popover.

If you need to exclude an element from the trap, add `data-tour-focus-skip="true"` anywhere in its ancestor chain. This is useful for decorative buttons or utility controls that should remain reachable by screen readers but not considered part of the interaction loop.

Target descriptions (`target.description`) are announced via an off-screen description that is referenced by the popover’s `aria-describedby`, so users get context about what the highlight represents.

### Guard focus indicators

When focus lands on a guard element, Flowsterix renders a highlight ring around either the spotlight cutout (for target guards) or the popover (for popover guards). Both rings are rendered as positioned `<div>` elements with `box-shadow`.

The guard elements carry `data-tour-prevent-shortcut="true"` so HUD shortcuts do not advance steps when a guard is focused.

### Customizing the focus ring

Customize the focus ring appearance through the flow's HUD options using the `guardElementFocusRing` API:

```ts
const flow = createFlow({
  id: 'guided-demo',
  version: { major: 1, minor: 0 },
  hud: {
    guardElementFocusRing: {
      boxShadow: '0 0 0 2px white, 0 0 0 4px blue, 0 0 12px 4px rgba(59, 130, 246, 0.4)',
    },
  },
  steps: [
    /* ... */
  ],
})
```

The `boxShadow` value is applied to both the target ring and popover ring when their respective guards receive focus. If not specified, the default uses `--primary` with a subtle outer glow.

## Dominating Other Focus Traps

When a modal library traps focus, it can prevent keyboard access to the tour popover. If you want Flowsterix to be the only focus trap, disable the modal's trap while the tour is running.

```tsx
import { useRadixDialogAdapter } from '@flowsterix/react'

function SettingsDialog() {
  const { dialogProps, contentProps } = useRadixDialogAdapter({
    disableEscapeClose: true,
  })

  return (
    <Dialog {...dialogProps}>
      <DialogTrigger data-tour-target="settings-trigger">
        Settings
      </DialogTrigger>
      <DialogContent {...contentProps} data-tour-target="settings-dialog">
        {/* ... */}
      </DialogContent>
    </Dialog>
  )
}
```

The Radix adapter also prevents focus-outside from dismissing the dialog
while the tour is active, so the dialog stays open when focus moves to
the tour popover. Set `disableEscapeClose: true` if you want to suppress
Escape-to-close while the tour is running.

For other UI libraries, call `useTourFocusDominance()` and map
`suspendExternalFocusTrap` to the equivalent props (e.g. `inert`,
`disableEnforceFocus`, `trapFocus`, etc.).

### Programmatic Dialog Control

When tour steps target elements inside a Radix dialog, use `createRadixDialogHelpers` in lifecycle hooks:

```tsx
import { createRadixDialogHelpers } from '@flowsterix/react'

const settingsDialog = createRadixDialogHelpers({
  contentSelector: '[data-tour-target="settings-dialog"]',
  triggerSelector: '[data-tour-target="settings-trigger"]',
})

// In your flow step:
{
  id: 'settings-panel',
  target: { selector: '[data-tour-target="settings-dialog"]' },
  onEnter: settingsDialog.open,
  onResume: settingsDialog.open,
  onExit: settingsDialog.close,
  content: <p>Configure your settings here</p>,
}
```

The helpers handle DOM timing automatically using `waitForDom()` and close dialogs via Escape key dispatch for clean Radix integration.

## Popover Roles and Labels

Popover dialogs use `role="dialog"` by default with `aria-modal="false"` so users can still interact with the highlighted area. You can override or extend the ARIA metadata through HUD popover options:

```ts
const flow = createFlow({
  id: 'guided-demo',
  version: { major: 1, minor: 0 },
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

## Internationalization (i18n)

All user-facing text in the tour UI can be customized via the `labels` prop on `TourProvider`. This includes button text, screen reader labels, and error messages.

```tsx
<TourProvider
  flows={flows}
  labels={{
    // Button labels
    back: 'Zurück',
    next: 'Weiter',
    finish: 'Fertig',
    skip: 'Tour überspringen',
    holdToConfirm: 'Gedrückt halten zum Bestätigen',

    // Screen reader labels
    ariaStepProgress: ({ current, total }) => `Schritt ${current} von ${total}`,
    ariaTimeRemaining: ({ ms }) => `${Math.ceil(ms / 1000)} Sekunden verbleibend`,
    ariaDelayProgress: 'Automatischer Fortschritt',

    // Visible formatters
    formatTimeRemaining: ({ ms }) => `${Math.ceil(ms / 1000)}s verbleibend`,

    // Target issue messages
    targetIssue: {
      missingTitle: 'Ziel nicht sichtbar',
      missingBody: 'Das Zielelement ist derzeit nicht sichtbar.',
      missingHint: 'Die letzte bekannte Position wird angezeigt.',
      hiddenTitle: 'Ziel nicht sichtbar',
      hiddenBody: 'Das Zielelement ist derzeit nicht sichtbar.',
      hiddenHint: 'Die letzte bekannte Position wird angezeigt.',
      detachedTitle: 'Ziel hat die Seite verlassen',
      detachedBody: 'Navigieren Sie zurück zur Seite mit diesem Element.',
    },
  }}
>
```

### Label Categories

| Category | Purpose |
|----------|---------|
| Button labels | Text on Back, Next, Skip buttons |
| Aria labels | Screen reader announcements |
| Formatters | Dynamic text (time remaining, progress) |
| Target issues | Error messages when target is missing/hidden |

Only override the labels you need—defaults are provided for all keys.

## Backdrop Interaction Modes

Not every tour should freeze the UI behind it. Flowsterix now treats backdrop interaction as a first-class setting so you can decide whether the dimmed scrim absorbs pointer events or lets them pass through.

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
  version: { major: 1, minor: 0 },
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

When a tour step grabs the user's attention, drifting content can be just as distracting as stray clicks. Flowsterix now lets you opt into body scroll locking independently of backdrop interaction modes.

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
  version: { major: 1, minor: 0 },
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

Sometimes a step's element technically exists but is collapsed to `display: none`, zero width/height, or otherwise hidden from assistive tech. Flowsterix watches for that state and, after a short grace period (900&nbsp;ms by default), either centers the HUD on the screen or silently skips to the next step.

Control the behavior per step with `targetBehavior`:

```ts
const flow = createFlow({
  id: 'guided-demo',
  version: { major: 1, minor: 0 },
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
- Flowsterix already detects nested scroll containers, so the same margin keeps targets inside overflow panels padded as they animate into view.
- The helper clamps negative values to zero and falls back to the default 16 px margin whenever a side isn’t provided.
- Add `targetBehavior.scrollMode` when you want Flowsterix to reposition the viewport even if the target is technically visible. Use `'start'` to pin the element just below the margin buffer, `'center'` (the default) to center it inside the available space, or `'preserve'` to keep the lighter-touch behavior that only scrolls when the element would otherwise be clipped.

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

When the tour ends or pauses, keyboard focus returns to the element that was active beforehand. If that element disappears during the tour, Flowsterix simply leaves focus where it is—avoiding confusing jumps.

These defaults aim to cover most accessibility needs out of the box. For additional requirements, reach out via issues or extend the components—every piece is built with customisation in mind.
