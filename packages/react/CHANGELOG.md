# @flowsterix/react

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
