# @flowsterix/react

## 0.12.1

### Patch Changes

- Add stagger animation to flows tab (matching steps tab behavior)
- Fix header border visible when devtools panel is collapsed

## 0.12.0

### Minor Changes

- Add motion system and polished DevTools animations
  - New `motion.ts` module with spring configs, tweens, stagger presets, and `useReducedMotion` hook
  - TabNav: sliding indicator, badge pop animation on count change
  - StepList: staggered entrance animations, AnimatePresence for item add/remove
  - StepItem: hover glow effect, order badge animation, delete button interaction
  - FlowItem: status badge transitions, hover shadow
  - FlowEditModal: spring entrance, backdrop blur, error shake animation
  - GrabberOverlay: selection confirmation pulse
  - Toolbar: spring copied badge, grab button pulsing glow
  - DevToolsProvider: improved accordion animation with spring physics

- Performance improvements
  - Replace `layoutId` with CSS transitions to prevent drag sluggishness
  - Remove unnecessary `layout` props from FlowItem and StepList items
  - All animations respect `prefers-reduced-motion`

## 0.11.1

### Patch Changes

- Fix DevTools state sharing across Vite entry points
  - Add global bridge for sharing TourProvider state with DevTools, bypassing Vite's separate context bundling
  - Expose storage methods (getFlowState, deleteFlowStorage, updateFlowStorage) on main TourContext
  - Update useFlowsData hook to use useSyncExternalStore with global bridge
  - Fix DevToolsProvider dragStartRef to use useRef properly
  - Enable bundle splitting in tsup config for shared code

## 0.11.0

### Minor Changes

- Add `@flowsterix/react/devtools` subpath export
  - Migrated devtools from separate `@flowsterix/devtools` package
  - Added Flows tab for viewing and editing flow storage entries
  - DevToolsProvider now integrates with TourProvider context
  - Tree-shakeable when not used

  Migration from `@flowsterix/devtools`:

  ```diff
  - import { DevToolsProvider } from '@flowsterix/devtools'
  + import { DevToolsProvider } from '@flowsterix/react/devtools'
  ```

  Note: DevToolsProvider must now be placed inside TourProvider.

## 0.10.1

### Patch Changes

- Fix popover incorrectly entering dock mode when cross-axis placements have space
  - Enable cross-axis flipping in flip middleware so popover tries left/right when top/bottom don't fit
  - Use correct dimensions for space checks (width for horizontal, height for vertical)

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

### Patch Changes

- Updated dependencies []:
  - @flowsterix/core@0.10.0

## 0.9.0

### Minor Changes

- Add createRadixDialogHelpers and waitForDom utilities for programmatic dialog control

  New exports for controlling Radix dialogs in tour lifecycle hooks:
  - `createRadixDialogHelpers({ contentSelector, triggerSelector })` - Factory that returns `isOpen()`, `open()`, and `close()` helpers
  - `waitForDom()` - Utility to wait for animation frame + microtask flush

  These complement `useRadixDialogAdapter` for complete Radix dialog integration in tours.

## 0.8.1

### Patch Changes

- Fix: remove @tanstack/react-router dependency from main entry point

  The router/index.ts barrel file was incorrectly exporting TanStack-specific adapters, causing build errors for users who don't have @tanstack/react-router installed. Router-specific adapters are now only available via their dedicated entry points (e.g., @flowsterix/react/router/tanstack).

## 0.8.0

### Minor Changes

- - Back button now shows by default after target event advances (previously was hidden)
  - Default popover offset changed from 16px to 32px

## 0.7.0

### Minor Changes

- Add `advanceStep(stepId)` to `useTour()` hook
  - Advances the flow only if currently on the specified step
  - Enables components to trigger tour progression as a side effect
  - Example: `advanceStep('upload-step')` after a file upload completes

### Patch Changes

- Updated dependencies []:
  - @flowsterix/core@0.5.0

## 0.6.0

### Minor Changes

- Add route mismatch pause/resume behavior and internationalization for target issue labels

  **Route Mismatch Handling:**
  - Flow automatically pauses when user navigates away from a step's `route`
  - Flow auto-resumes when user returns to the correct route
  - For steps without `route`: flow pauses after grace period if target is missing, resumes when user navigates elsewhere

  **Internationalization:**
  - Added `labels.targetIssue` to `TourProvider` for customizing target issue messages
  - All target issue text (missing, hidden, detached) now uses the labels system

## 0.5.0

### Minor Changes

- Add grace period for hidden/missing target handling
  - Backdrop now shows immediately when target is not found, providing visual feedback
  - Popover is hidden during 400ms grace period to avoid jarring movements when elements load quickly
  - If a fallback rect exists (from previous visit), popover shows at that position during grace period
  - Unified "hidden" and "missing" target states to show consistent "Target not visible" message
  - New `isInGracePeriod` flag exposed from `useHiddenTargetFallback` and `useHudState`
  - New `isInGracePeriod` option for `useTourOverlay` to control backdrop visibility during grace
  - New `isInGracePeriod` prop for `TourPopoverPortal` to control popover visibility

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
