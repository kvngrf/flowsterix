# @flowsterix/react

## 0.4.2

### Patch Changes

- Fix popover rendering when target element cannot be found and no last position is known. Previously, the popover would render off-screen (cut off at bottom) while focus trap remained active, leaving users stuck. Now falls back to screen mode after delay, centering the popover so users can see and skip the flow.

## 0.4.1

### Patch Changes

- Fix autostart flow selection to consider route matching. Previously, only the first eligible flow was considered regardless of route. Now all eligible flows are checked and the first one whose route matches the current path is started.

## 0.4.0

### Minor Changes

- - Route-gated autostart: flows with `autoStart` now wait until the current route matches the first step's `route` pattern before starting
  - Multi-flow eligibility: when multiple flows have `autoStart`, the first non-completed/non-skipped flow is selected
  - Parallel storage reads for autostart eligibility check
  - Fix popover placement fallback: uses `bestFit` strategy to try all placements before docking
  - Export `handleVersionMismatch` from core and `matchRoute` from react/router

### Patch Changes

- Updated dependencies []:
  - @flowsterix/core@0.4.0

## 0.3.1

### Patch Changes

- Fix module resolution error for @tanstack/react-router

  Router-specific utilities (TanStackRouterSync, getTourRouter, etc.) are no longer
  exported from the main entry point. Import them from subpaths instead:
  - `@flowsterix/react/router/tanstack` - TanStack Router
  - `@flowsterix/react/router/react-router` - React Router
  - `@flowsterix/react/router/next-app` - Next.js App Router
  - `@flowsterix/react/router/next-pages` - Next.js Pages Router

  This prevents bundlers from trying to resolve optional router dependencies.

## 0.3.0

### Minor Changes

- Add async-aware state methods for storage persistence

  State-changing methods (`complete`, `cancel`, `start`, `next`, `back`, `goToStep`, `pause`, `resume`) now return `MaybePromise<FlowState>`:
  - Sync storage adapters return `FlowState` immediately (unchanged behavior)
  - Async storage adapters return `Promise<FlowState>` that resolves after persistence

  This allows consumers to `await complete()` before page redirects to ensure API persistence completes.

### Patch Changes

- Updated dependencies []:
  - @flowsterix/core@0.3.0

## 0.2.1

### Patch Changes

- Fix motion type compatibility for motion@12.29.0

## 0.2.0

### Minor Changes

- Add `guardElementFocusRing` API for customizing focus ring appearance
  - Added `hud.guardElementFocusRing.boxShadow` option to flow config for programmatic focus ring customization
  - Focus rings now render as portal divs for both target and popover guards (consistent behavior)
  - Default focus ring uses `--primary` CSS variable with outer glow
  - Removed CSS variable-based customization (`--tour-focus-ring-color`, `--tour-focus-ring-offset-color`)
  - Removed `targetRingOffset` prop from `TourFocusManager` (use `guardElementFocusRing` instead)

### Patch Changes

- Updated dependencies []:
  - @flowsterix/core@0.2.0

## 0.1.1

### Patch Changes

- Fix asymmetrical highlight padding for elements near viewport edges. Padding now scales symmetrically based on available space, keeping highlights visually balanced regardless of element position.
