# @flowsterix/core

## 0.4.0

### Minor Changes

- - Route-gated autostart: flows with `autoStart` now wait until the current route matches the first step's `route` pattern before starting
  - Multi-flow eligibility: when multiple flows have `autoStart`, the first non-completed/non-skipped flow is selected
  - Parallel storage reads for autostart eligibility check
  - Fix popover placement fallback: uses `bestFit` strategy to try all placements before docking
  - Export `handleVersionMismatch` from core and `matchRoute` from react/router

## 0.3.0

### Minor Changes

- Add async-aware state methods for storage persistence

  State-changing methods (`complete`, `cancel`, `start`, `next`, `back`, `goToStep`, `pause`, `resume`) now return `MaybePromise<FlowState>`:
  - Sync storage adapters return `FlowState` immediately (unchanged behavior)
  - Async storage adapters return `Promise<FlowState>` that resolves after persistence

  This allows consumers to `await complete()` before page redirects to ensure API persistence completes.

## 0.2.0

### Minor Changes

- Add `guardElementFocusRing` API for customizing focus ring appearance
  - Added `hud.guardElementFocusRing.boxShadow` option to flow config for programmatic focus ring customization
  - Focus rings now render as portal divs for both target and popover guards (consistent behavior)
  - Default focus ring uses `--primary` CSS variable with outer glow
  - Removed CSS variable-based customization (`--tour-focus-ring-color`, `--tour-focus-ring-offset-color`)
  - Removed `targetRingOffset` prop from `TourFocusManager` (use `guardElementFocusRing` instead)
