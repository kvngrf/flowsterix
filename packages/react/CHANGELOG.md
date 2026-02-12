# @flowsterix/react

## 0.14.4

### Patch Changes

- Prevent constrained scroll lock from activating on `screen` steps, so body scroll lock no longer introduces scrollbar-driven layout shifts for full-screen targets.

  Keep the previous highlight/popover anchor during step transitions to oversized targets until the incoming target covers most of the viewport, avoiding transient vanish/jump behavior before constrained scrolling settles.

  Ensure screen-target steps reset popover layout back to floating on desktop so transitions from oversized/docked steps re-center correctly.

  Promote cached highlight/popover anchors synchronously when a target becomes promotable, preventing brief anchor loss during fast step switches into oversized-scroll steps.

  Avoid reapplying stale per-step popover floating cache until the incoming target is actually promotable, so popovers stay pinned to the previous anchor during long oversized-target scroll transitions.

  Restore animated highlight transitions in the shadcn `TourHUD` constrained-scroll path (no forced zero-duration snap), so settled target handoff remains smooth.

  Rebase popover repositioning on the resolved anchor rect (including preserved handoff anchors) instead of only `liveTargetUsable`, so popovers no longer stay pinned to the previous step after oversized-target transitions settle.

  Prevent stale popover positions from being cached under the incoming step ID while its anchor is still preserved from the previous step; cache persistence now waits until the incoming target is promotable.

  Freeze popover auto-positioning during cross-step handoff until the incoming target is promotable, so popovers keep their previous on-screen position while oversized target scroll/settle is in progress.

  Expand opt-in popover debug logging with handoff state transitions, source-tagged position writes, deduped skip reasons, and DOM-vs-state drift reports to diagnose sticky positioning paths.

  Disable Motion shared `layoutId` projection for steps that enter frozen handoff (and auto-disable on detected drift), preventing scroll-linked DOM offset from pulling the popover away from its intended fixed coordinates.

  Retain popover content keys across transient `null` step-id frames while anchor persistence is active, preventing blank content/remount gaps during oversized-target handoff transitions.

## 0.14.3

### Patch Changes

- Patch release for React HUD/overlay transition improvements and maintainer documentation updates in core and react packages.
- Updated dependencies
  - @flowsterix/core@0.10.2

## 0.14.2

### Patch Changes

- Add support for `targetBehavior.scrollDurationMs` to control smooth scroll timing when bringing targets into view.
- Improve scroll synchronization for large step jumps:
  - Ignore page-level CSS smooth scrolling while a step uses `scrollDurationMs`, so Flowsterix duration control stays deterministic.
  - Prevent repeated auto-scroll re-dispatch while the target is already progressing into view.
- Keep HUD positioning stable during long jumps:
  - Overlay highlight and popover now keep their previous on-screen position while the next target is still offscreen.
  - They move to the new target once it enters the viewport.
- Respect `targetBehavior.scrollMargin` in constrained scroll-lock mode for oversized targets so top/bottom spacing is preserved while scrolling.
- Prevent popover flash/unmount during step transitions (including docked -> floating back-navigation) by persisting the previous rendered position while the next target is still resolving.
- Reduce oversize-target stutter when re-entering view by avoiding repeated recenter attempts during constrained scrolling (`preserve` mode + redispatch only when stalled).
- Internal: expand `README.md` into a maintainer-focused, full-coverage package documentation entry point (architecture, data flows, capabilities, and exhaustive API inventory).

## 0.14.1

### Patch Changes

- Enable constrained scroll lock on desktop for oversized highlights
  - `TourPopoverPortal` now reports its rendered height via `onHeightChange` callback
  - TourHUD passes popover height as `scrollLockBottomInset` on desktop, matching the mobile drawer pattern
  - Ensures all highlighted content is reachable via scroll when the highlight exceeds the viewport

- Fix popover shrinking when entering docked layout mode
  - Docked position used `translate3d(-100%, -100%, 0)` which caused CSS shrink-to-fit to collapse the element to 24px available width
  - Now calculates actual top-left position from measured `floatingSize`, avoiding percentage-based transforms

## 0.14.0

### Minor Changes

- Add mobile drawer support for TourHUD
  - New `scrollLockBottomInset` option on `useTourHud` to account for bottom UI (e.g. mobile drawer height)
  - `bottomInset` option on `useConstrainedScrollLock` adjusts scroll bounds so targets remain visible above the inset
  - `useConstrainedScrollLock` now returns `{ isConstrainedMode }` to signal when constrained scrolling is active
  - `useTourHud` exposes `isConstrainedScrollActive` in its result

### Patch Changes

- Fix highlight jumping 2x during constrained scroll when target extends beyond viewport
  - `expandRect` padding could go negative when element exceeded viewport bounds, causing compounding position offsets
  - Clamp vertical/horizontal padding to `Math.max(0, ...)` so it never inverts

- Fix `advanceStep` to return `null` instead of throwing when no active store

- Fix SSR hydration: use stable server snapshot references in `globalBridge` and `useStepStore`

## 0.13.0

### Minor Changes

- Add constrained scroll lock for large highlighted targets
  - When target exceeds viewport height, allows scrolling within target bounds only
  - Target fits in viewport: normal scroll lock (`overflow: hidden`)
  - Target exceeds viewport: constrained to target bounds (minY/maxY)
  - New `useConstrainedScrollLock` hook exported from main entry
  - Integrated into `useTourHud` - no configuration needed

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
