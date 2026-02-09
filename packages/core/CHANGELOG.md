# @flowsterix/core

## 0.10.2

### Patch Changes

- Add maintainer-focused package documentation in `README.md` covering architecture, API inventory, and runtime data flow.

## 0.10.1

### Patch Changes

- Add `scrollDurationMs` to `StepTargetBehavior` to allow configuring smooth scroll duration for step targets.

## 0.10.0

### Minor Changes

- feat: Add declarative Radix Dialog integration
  - Add `dialogs` configuration to `FlowDefinition` for declarative dialog control
  - Add `dialogId` property to `Step` to link steps with dialogs
  - Add `useRadixTourDialog` hook for automatic dialog open/close during tours
  - Add `DialogRegistryProvider` for tracking mounted dialog controllers
  - Dialog stays open when navigating between steps with same `dialogId`
  - Auto-close when moving to step with different/no `dialogId`
  - Configurable `autoOpen` (onEnter/onResume) and `autoClose` behavior
  - `onDismissGoToStepId` handles user-initiated dialog close (ESC/backdrop)
  - Remove `createRadixDialogHelpers` (replaced by `useRadixTourDialog`)

## 0.5.0

### Minor Changes

- Add `advanceStep(stepId)` method to `FlowStore`
  - Advances the flow only if currently on the specified step
  - Returns current state (no-op) if on a different step, stepId doesn't exist, or flow is not running
  - Useful for components that trigger tour progression as a side effect (e.g., form submissions, tab clicks)
  - Calls `next()` internally, which completes the flow if on the last step

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
