# Mobile Support

Flowsterix provides optimized mobile experiences through the `MobileDrawer` component, automatically rendered by `TourHUD` on smaller viewports.

## Automatic Mobile Detection

`TourHUD` detects mobile viewports and switches from floating popover to bottom sheet drawer:

```tsx
<TourHUD
  mobile={{
    enabled: true,      // Enable mobile drawer (default: true)
    breakpoint: 640,    // Width threshold in pixels (default: 640)
  }}
/>
```

When `window.innerWidth <= breakpoint`, the drawer replaces the popover.

## Content-Aware Height

The drawer automatically sizes to fit its content:

1. **Measures content** - Uses ResizeObserver to track content height
2. **Adds chrome** - Includes handle (~28px), header (~40px), controls (~72px)
3. **Caps at max** - Won't exceed `maxHeightRatio` of viewport (default 85%)
4. **No flicker** - Starts small, animates up once measured

```tsx
<TourHUD
  mobile={{
    maxHeightRatio: 0.7,  // Cap at 70% viewport (default: 0.85)
  }}
/>
```

Small content → drawer only as tall as needed
Large content → capped at max, scrollable

## Snap Points

The drawer supports three snap points:

| Snap Point | Height | Description |
|------------|--------|-------------|
| `minimized` | ~100px | Step indicator + navigation only |
| `peek` | ~40% of expanded | Content summary (opt-in) |
| `expanded` | auto | Sized to content, capped at `maxHeightRatio` |

### Configuration

```tsx
<TourHUD
  mobile={{
    // Default: two-state (minimized ↔ expanded)
    snapPoints: ['minimized', 'expanded'],
    defaultSnapPoint: 'expanded',

    // Optional: three-state with peek
    // snapPoints: ['minimized', 'peek', 'expanded'],
  }}
/>
```

## Gestures

| Gesture | Action |
|---------|--------|
| Swipe down | Move to smaller snap point |
| Swipe up | Move to larger snap point |
| Tap handle | Toggle between minimized/expanded |

### Physics

Drawer uses spring animation for natural feel:
- `damping: 30`
- `stiffness: 400`
- `elastic: { top: 0.1, bottom: 0.3 }`

## Step Transitions

When moving to a new step:
1. Drawer resets to `expanded` state
2. Content crossfades with animation
3. Progress indicator updates

```tsx
// Step transition animation
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
```

## Safe Area Support

The drawer respects iOS safe area insets for notched phones:

```css
padding-bottom: env(safe-area-inset-bottom, 0px);
```

## Accessibility

- `aria-live="polite"` announces when drawer is minimized
- Content is `aria-hidden` when minimized
- Progress indicator has proper `role="progressbar"`

## Constrained Scroll Lock

When a highlighted target element is larger than the viewport, normal scroll lock would prevent users from seeing the entire element. Flowsterix handles this with **constrained scroll lock**:

- **Target fits in viewport**: Normal scroll lock (`overflow: hidden`)
- **Target exceeds viewport**: Allows scrolling within target bounds only

This ensures users can scroll to see all parts of a large highlighted element while still preventing them from scrolling away from it.

```tsx
// Automatically handled by useTourHud
// No configuration needed - behavior adapts to target size
```

The scroll bounds are calculated as:
- **minY**: Scroll position where target bottom aligns with viewport bottom
- **maxY**: Scroll position where target top aligns with viewport top

Padding from the overlay highlight is respected in these calculations.

## Standalone Usage

The drawer can be used independently of `TourHUD`:

```tsx
import { MobileDrawer } from '@/components/mobile-drawer'

<MobileDrawer
  defaultSnapPoint="expanded"
  snapPoints={['minimized', 'peek', 'expanded']}
  allowMinimize={true}
  onSnapPointChange={(point) => console.log(point)}
  controls={{ showSkip: true }}
  progress={{ show: true, variant: 'fraction' }}
  stepKey={currentStep.id}
>
  <StepContent>
    <StepTitle>{currentStep.title}</StepTitle>
    <StepText>{currentStep.description}</StepText>
  </StepContent>
</MobileDrawer>
```

## Props Reference

### MobileDrawerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Drawer content |
| `defaultSnapPoint` | `'minimized' \| 'peek' \| 'expanded'` | `'expanded'` | Initial snap point |
| `snapPoints` | `Array<...>` | `['minimized', 'expanded']` | Available snap points |
| `allowMinimize` | `boolean` | `true` | Allow minimizing drawer |
| `maxHeightRatio` | `number` | `0.85` | Max height as ratio of viewport |
| `onSnapPointChange` | `(point) => void` | - | Callback on snap |
| `controls` | `TourControlsProps` | - | Navigation button config |
| `progress` | `TourProgressProps & { show?: boolean }` | - | Progress indicator config |
| `stepKey` | `string` | - | Key for crossfade animation |

### TourHUD mobile prop

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable mobile drawer |
| `breakpoint` | `number` | `640` | Width threshold (px) |
| `defaultSnapPoint` | `'minimized' \| 'peek' \| 'expanded'` | `'expanded'` | Initial state |
| `snapPoints` | `Array<...>` | `['minimized', 'expanded']` | Available states |
| `allowMinimize` | `boolean` | `true` | Allow swipe to minimize |
| `maxHeightRatio` | `number` | `0.85` | Max height as ratio of viewport |
| `onSnapPointChange` | `(point) => void` | - | Callback on snap |

## Disabling Mobile Drawer

To use floating popover on all viewports:

```tsx
<TourHUD mobile={{ enabled: false }} />
```

## Landscape Mode

Landscape mobile orientation is planned for future implementation. See `FUTURE.md` for details on the side-panel approach.
