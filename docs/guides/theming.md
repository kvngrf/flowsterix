# Theming the tour HUD

The React bindings ship with a default look so the overlay, popover, and controls are immediately usable. Those styles are now expressed through CSS custom properties and `data-tour-*` attributes, which makes it easy to align the HUD with your brand system or utility framework.

## Custom properties

Import `@tour/react/styles.css` once, then override any of the exported CSS variables from your own stylesheet. The variables are grouped by surface:

### Popover

- `--tour-popover-background`
- `--tour-popover-foreground`
- `--tour-popover-radius`
- `--tour-popover-shadow`
- `--tour-popover-width`
- `--tour-popover-max-width`
- `--tour-popover-border-width`
- `--tour-popover-border-color`
- `--tour-popover-padding-block`
- `--tour-popover-padding-inline`
- `--tour-popover-gap`
- `--tour-popover-mobile-width`
- `--tour-popover-mobile-max-width`
- `--tour-popover-mobile-radius`
- `--tour-popover-mobile-padding-inline`
- `--tour-popover-mobile-padding-top`
- `--tour-popover-mobile-padding-bottom`

### Controls & focus ring

- `--tour-controls-margin-block-start`
- `--tour-controls-gap`
- `--tour-controls-button-gap`
- `--tour-button-font-size`
- `--tour-button-font-weight`
- `--tour-button-radius`
- `--tour-button-padding-block`
- `--tour-button-padding-inline`
- `--tour-button-primary-*` (`bg`, `color`, `border`, `hover-bg`, `disabled-bg`, `disabled-opacity`)
- `--tour-button-secondary-*` (`bg`, `color`, `border`, `hover-bg`, `hover-border`, `disabled-opacity`)
- `--tour-focus-ring-width`
- `--tour-focus-ring-offset`
- `--tour-focus-ring-color`
- `--tour-focus-ring-offset-color`

### Overlay

- `--tour-overlay-background`
- `--tour-overlay-ring-shadow`
- `--tour-overlay-blur`
- `--tour-overlay-radius`
- `--tour-shadow-hud-panel`

### Target status banner

- `--tour-target-alert-background`
- `--tour-target-alert-border`
- `--tour-target-alert-color`
- `--tour-target-alert-hint-color`
- `--tour-target-alert-icon-background`
- `--tour-target-alert-icon-color`
- `--tour-target-alert-hidden-background`
- `--tour-target-alert-hidden-border`
- `--tour-target-alert-detached-background`
- `--tour-target-alert-detached-border`

Every custom property falls back to the previous visual design, so existing installs continue to look the same until you override them.

```css
:root {
  --tour-popover-background: color-mix(in srgb, var(--popover) 95%, black 5%);
  --tour-button-primary-bg: var(--brand-primary);
  --tour-button-primary-hover-bg: color-mix(
    in srgb,
    var(--brand-primary) 80%,
    black 20%
  );
  --tour-overlay-background: rgba(13, 34, 64, 0.7);
}
```

## Attribute hooks

Components expose targeted `data-tour-*` attributes so you can layer utility classes or author more specific selectors when variables are not enough.

| Attribute                                  | Applies to                                                            |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `data-tour-popover`                        | Popover surface (portal root)                                         |
| `data-layout`                              | Current layout mode (`floating`, `docked`, `manual`, `mobile`)        |
| `data-tour-popover-content`                | Animated content wrapper per step                                     |
| `data-tour-popover-shell`                  | Popover container used for the drag handle                            |
| `data-tour-popover-handle`                 | Drag handle button when docked/manual                                 |
| `data-target-visibility`                   | Popover state describing whether the target is visible/hidden/missing |
| `data-rect-source`                         | Indicates if the highlight uses live, stored, or viewport geometry    |
| `data-tour-controls`                       | Controls container (Back/Skip + Next)                                 |
| `data-tour-controls-group`                 | The secondary button group (Back/Skip)                                |
| `data-tour-button="secondary"`             | Back and Skip buttons                                                 |
| `data-tour-button="primary"`               | Next/Finish button                                                    |
| `data-tour-overlay`                        | Overlay portal wrapper                                                |
| `data-tour-overlay-layer="backdrop"`       | Masked backdrop around the target                                     |
| `data-tour-overlay-layer="segment"`        | Fallback rectangles when masking is unavailable                       |
| `data-tour-overlay-layer="highlight-ring"` | Highlight border around the active target                             |
| `data-tour-target-alert`                   | Status banner rendered when the target is missing/hidden              |

With Tailwind&nbsp;CSS v4, you can author utility hooks directly:

```css
@layer utilities {
  [data-tour-button='primary'] {
    @apply bg-brand-600 text-white;
  }

  [data-tour-button='primary']:hover {
    @apply bg-brand-700;
  }

  [data-tour-overlay-layer='backdrop'] {
    @apply bg-black/70;
  }
}
```

(If you are using Tailwind v3, register a `data-tour` variant in your config before applying utilities.)

### Responsive layout hooks

On narrow viewports the HUD automatically switches to a mobile-friendly layout that behaves like a bottom sheet. You can fine-tune that mode with the attribute hooks listed above:

- `[data-tour-popover][data-layout='mobile']` – adjust padding, radius, and safe-area spacing for the sheet container.
- Override the same surface via the mobile-specific tokens above when you’d prefer declarative theme control instead of authoring selectors.
- `[data-tour-controls]` within the mobile selector – stack controls vertically or make the primary button span the full width.
- `[data-target-visibility]` / `[data-rect-source]` – badge the popover when the target is missing or Flowster is relying on cached geometry.
- `[data-tour-target-alert]` – restyle or replace the built-in status banner.

## Token helpers & runtime overrides

The React package now exports a typed token map that mirrors every CSS variable. Import the helpers when you need to:

- Reference a token path without hard-coding the CSS variable name.
- Merge overrides in JavaScript/TypeScript instead of writing a new stylesheet.
- Point flow-level options (like the highlight ring shadow) at a reusable token.

```ts
import {
  cssVar,
  defaultTokens,
  mergeTokens,
  TourProvider,
} from '@tour/react'

const brandTokens = mergeTokens(defaultTokens, {
  overlay: {
    ringShadow:
      'inset 0 0 0 2px rgba(236,72,153,0.55), inset 0 0 0 10px rgba(22,22,36,0.65)',
    blur: '4px',
  },
  shadow: {
    hud: {
      panel: '0 30px 70px -35px rgba(13,15,40,0.85)',
    },
  },
})

function App() {
  return (
    <TourProvider flows={flows} tokens={brandTokens}>
      {/* ... */}
    </TourProvider>
  )
}
```

Inside a flow definition you can now override tokens directly, which keeps per-step styles aligned with your theme without re-specifying box-shadow strings:

```ts
export const flow = createFlow({
  hud: {
    tokens: {
      overlay: {
        ringShadow:
          'inset 0 0 0 2px rgba(236,72,153,0.55), inset 0 0 0 10px rgba(22,22,36,0.65)',
      },
    },
  },
  steps: [
    /* ... */
  ],
})
```

Anywhere you need the literal value (for example, a custom HUD component), call `cssVar('shadow.hud.panel')` to get a `var(--tour-shadow-hud-panel)` reference with the correct fallback attached.

Need sharper or rounder highlight corners? Override the `overlay.radius` token once (for example, `overlay: { radius: '0px' }`) and every HUD instance will adopt the new rounding without adjusting individual flows.

### Per-flow token overrides

When only a single flow should diverge from your global theme, add `hud.tokens` inside that flow definition. Those overrides merge with the provider-level tokens when the flow runs, then automatically revert when it exits:

```ts
export const flow = createFlow({
  id: 'promo-flow',
  version: 1,
  hud: {
    tokens: {
      overlay: {
        radius: '0px',
        ringShadow:
          'inset 0 0 0 3px rgba(251,191,36,0.9), inset 0 0 0 12px rgba(8,7,2,0.85)',
      },
      button: {
        radius: '9999px',
        primary: {
          bg: '#fbbf24',
          color: '#1f2937',
        },
      },
    },
  },
  steps: [
    /* ... */
  ],
})
```

That keeps structural HUD settings (like overlay padding) available per flow while giving you complete CSS-variable parity whenever you need a bespoke visual treatment.

## Sandbox example

The Vite example app now maps the tour variables to its own design tokens. Inspect `examples/react-vite/src/styles.css` for a full reference on how the default surface is themed in both light and dark modes, and open `examples/react-vite/src/tour/theme.tsx` to see how runtime overrides are composed with `mergeTokens`.

Launch the example and use the **Tour theme** toggle in the header to swap between the classic style and the vivid “Aurora” and “Nebula” presets. The toggle now updates the `tokens` prop passed into `TourProvider`, which writes the matching CSS variables via `applyTokensToDocument`, while still flipping a `data-tour-theme` attribute on `<body>` so you can layer on additional CSS-only experiments if you’d like.
