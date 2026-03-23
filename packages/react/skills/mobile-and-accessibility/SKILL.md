---
name: mobile-and-accessibility
description: Mobile drawer, snap points, gestures, internationalization (i18n), and accessibility features for Flowsterix. Use when configuring mobile tour experience, customizing button labels, adding i18n support, or handling reduced motion.
metadata:
  sources:
    - docs/guides/mobile.md
    - docs/guides/accessibility.md
---

# Mobile & Accessibility

## Mobile Drawer

On viewports <=640px, `TourHUD` automatically renders a bottom sheet drawer instead of a floating popover.

```tsx
<TourHUD
  mobile={{
    enabled: true,              // Enable mobile drawer (default: true)
    breakpoint: 640,            // Width threshold (default: 640)
    defaultSnapPoint: 'expanded',
    snapPoints: ['minimized', 'expanded'],
    allowMinimize: true,
    maxHeightRatio: 0.85,       // Cap at 85% viewport
  }}
/>
```

### Snap Points

- `minimized` (~100px) - Step indicator + nav buttons only
- `peek` (~40% of expanded) - Optional middle state for summaries
- `expanded` (auto) - Sized to content, capped at `maxHeightRatio`

### Gestures

- Swipe down → minimize
- Swipe up → expand
- Tap handle → toggle between states

### Behavior

- **Auto-sizes to content** - Drawer height matches content + chrome
- **Capped at max** - Won't exceed `maxHeightRatio` of viewport
- **No flicker** - Starts small, animates up once content is measured
- Resets to `expanded` on step transitions
- Content crossfades between steps
- Safe area insets for notched phones
- `aria-live` announcement when minimized

### Three-State Drawer

```tsx
<TourHUD
  mobile={{
    snapPoints: ['minimized', 'peek', 'expanded'],
    defaultSnapPoint: 'expanded',
  }}
/>
```

### Constrained Scroll Lock

When body scroll lock is enabled and the highlighted target exceeds viewport height:
- Target fits in viewport → normal scroll lock (`overflow: hidden`)
- Target exceeds viewport → scroll constrained to target bounds only

## Internationalization (i18n)

All user-facing text is customizable via the `labels` prop on `TourProvider`.

```tsx
<TourProvider
  flows={[...]}
  labels={{
    // Button labels
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    skip: 'Skip tour',
    holdToConfirm: 'Hold to confirm',

    // Aria labels for screen readers
    ariaStepProgress: ({ current, total }) => `Step ${current} of ${total}`,
    ariaTimeRemaining: ({ ms }) => `${Math.ceil(ms / 1000)} seconds remaining`,
    ariaDelayProgress: 'Auto-advance progress',

    // Visible formatters
    formatTimeRemaining: ({ ms }) => `${Math.ceil(ms / 1000)}s remaining`,

    // Target issue messages
    targetIssue: {
      missingTitle: 'Target not visible',
      missingBody: 'The target element is not currently visible...',
      missingHint: 'Showing the last known position until the element returns.',
      hiddenTitle: 'Target not visible',
      hiddenBody: 'The target element is not currently visible...',
      hiddenHint: 'Showing the last known position until the element returns.',
      detachedTitle: 'Target left the page',
      detachedBody: 'Navigate back to the screen that contains this element...',
    },
  }}
>
```

### Example: German

```tsx
const germanLabels = {
  back: 'Zurück',
  next: 'Weiter',
  finish: 'Fertig',
  skip: 'Tour überspringen',
  holdToConfirm: 'Gedrückt halten zum Bestätigen',
  ariaStepProgress: ({ current, total }) => `Schritt ${current} von ${total}`,
  targetIssue: {
    missingTitle: 'Ziel nicht sichtbar',
    missingBody: 'Das Zielelement ist derzeit nicht sichtbar.',
    detachedTitle: 'Ziel hat die Seite verlassen',
    detachedBody: 'Navigieren Sie zurück zur Seite mit diesem Element.',
  },
}

<TourProvider flows={[...]} labels={germanLabels}>
```

## Focus Ring Customization

The focus trap uses hidden guard elements. Customize the ring via flow HUD options:

```ts
const flow = createFlow({
  id: 'my-tour',
  version: { major: 1, minor: 0 },
  hud: {
    guardElementFocusRing: {
      boxShadow: '0 0 0 2px white, 0 0 0 4px blue',
    },
  },
  steps: [/* ... */],
})
```

Default: `0 0 0 2px var(--primary), 0 0 8px 2px color-mix(in srgb, var(--primary) 40%, transparent)`.
