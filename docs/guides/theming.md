# Theming the tour HUD

Flowsterix no longer ships default HUD CSS or token helpers in `@flowsterix/react`. The UI now lives in the shadcn registry components, which you sync into each app and customize directly.

## Recommended approach

1. Sync the registry components into your app (see `packages/shadcn-registry/README.md`).
2. Edit the copied components under your app (for example `src/components/tour`) to match your design system.
3. Use Tailwind utilities, CSS variables, or component variants to style the HUD.

This keeps the UI fully in your control and avoids competing theming systems.

## Per-flow styling

If you need multiple visual styles in a single app:

- Create multiple HUD variants (copy the shadcn components into `tour-hud-variant-a.tsx`, `tour-hud-variant-b.tsx`).
- Switch which HUD you render based on the active flow id.
- Keep flow-specific copy in step content (`StepContent`, `StepTitle`, `StepText`) rather than relying on global tokens.

## What changed

- `@flowsterix/react/styles.css` was removed.
- Token helpers (`mergeTokens`, `cssVar`, `defaultTokens`) and provider `tokens` props were removed.
- The `@flowsterix/themes` presets are no longer wired into the HUD.

If you still want a token-driven system, reintroduce it inside your own components, but the core packages no longer depend on it.
