# Theming the tour HUD

The React bindings ship with a default look so the overlay, popover, and controls are immediately usable. Those styles are now expressed through CSS custom properties and `data-tour-*` attributes, which makes it easy to align the HUD with your brand system or utility framework.

## Custom properties

Import `@tour/react/styles.css` once, then override any of the exported CSS variables from your own stylesheet. The variables are grouped by surface:

### Popover

- `--tour-popover-background`
- `--tour-popover-foreground`
- `--tour-popover-radius`
- `--tour-popover-shadow`
- `--tour-popover-border-width`
- `--tour-popover-border-color`
- `--tour-popover-padding-block`
- `--tour-popover-padding-inline`
- `--tour-popover-gap`

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

Every custom property falls back to the previous visual design, so existing installs continue to look the same until you override them.

```css
:root {
  --tour-popover-background: color-mix(in srgb, var(--popover) 95%, black 5%);
  --tour-button-primary-bg: var(--brand-primary);
  --tour-button-primary-hover-bg: color-mix(in srgb, var(--brand-primary) 80%, black 20%);
  --tour-overlay-background: rgba(13, 34, 64, 0.7);
}
```

## Attribute hooks

Components expose targeted `data-tour-*` attributes so you can layer utility classes or author more specific selectors when variables are not enough.

| Attribute | Applies to |
| --- | --- |
| `data-tour-popover` | Popover surface (portal root) |
| `data-tour-popover-content` | Animated content wrapper per step |
| `data-tour-popover-shell` | Popover container used for the drag handle |
| `data-tour-popover-handle` | Drag handle button when docked/manual |
| `data-tour-controls` | Controls container (Back/Skip + Next) |
| `data-tour-controls-group` | The secondary button group (Back/Skip) |
| `data-tour-button="secondary"` | Back and Skip buttons |
| `data-tour-button="primary"` | Next/Finish button |
| `data-tour-overlay` | Overlay portal wrapper |
| `data-tour-overlay-layer="backdrop"` | Masked backdrop around the target |
| `data-tour-overlay-layer="segment"` | Fallback rectangles when masking is unavailable |
| `data-tour-overlay-layer="highlight-ring"` | Highlight border around the active target |

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

## Sandbox example

The Vite example app now maps the tour variables to its own design tokens. Inspect `examples/react-vite/src/styles.css` for a full reference on how the default surface is themed in both light and dark modes.
