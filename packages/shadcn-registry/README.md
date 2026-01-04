# Flowsterix Shadcn Registry

Self-hosted component registry for [shadcn/ui](https://ui.shadcn.com) compatible tour components.

## Installation

Install components directly from the registry:

```bash
# Install individual components
npx shadcn@latest add https://flowsterix.vercel.app/r/tour-controls.json
npx shadcn@latest add https://flowsterix.vercel.app/r/tour-overlay.json
npx shadcn@latest add https://flowsterix.vercel.app/r/tour-progress.json
npx shadcn@latest add https://flowsterix.vercel.app/r/delay-progress-bar.json

# Or install the complete HUD block
npx shadcn@latest add https://flowsterix.vercel.app/r/tour-hud.json

# Install an example flow
npx shadcn@latest add https://flowsterix.vercel.app/r/onboarding-flow.json
```

## Local Development

```bash
# Build the registry
pnpm registry:build

# Watch for changes during development
pnpm registry:dev
```

The build output will be in `public/r/` and can be served by any static file server.

## Components

| Component       | Description                                   |
| --------------- | --------------------------------------------- |
| `tour-provider` | Root provider for tour state management       |
| `tour-overlay`  | Spotlight overlay with target highlighting    |
| `tour-controls` | Navigation buttons (Back, Next, Skip)         |
| `tour-popover-handle` | Drag handle for docked/manual popovers   |
| `tour-progress` | Step progress indicator (dots, bar, fraction) |
| `delay-progress-bar` | Countdown bar for auto-advance steps |
| `tour-tooltip`  | Lightweight tooltip variant                   |
| `use-tour`      | Hook for accessing tour state and controls    |

## Blocks

| Block             | Description                           |
| ----------------- | ------------------------------------- |
| `tour-hud`        | Complete HUD combining all components |
| `onboarding-flow` | Example onboarding tour flow          |

## Usage

```tsx
import { TourProvider } from '@/components/tour/tour-provider'
import { TourHUD } from '@/components/tour/blocks/tour-hud'
import { onboardingFlow } from '@/lib/tours/onboarding'
import { useTour } from '@/components/tour/hooks/use-tour'

function App() {
  return (
    <TourProvider flows={[onboardingFlow]}>
      <TourHUD
        overlay={{ padding: 12, showRing: true }}
        progress={{ show: true, variant: 'dots' }}
      />
      <YourApp />
    </TourProvider>
  )
}

function StartTourButton() {
  const { startFlow } = useTour()

  return <button onClick={() => startFlow('onboarding')}>Start Tour</button>
}
```

## Customization

All components accept standard `className` props and use Tailwind CSS.
Customize them by:

1. **Editing the copied files** - Components are copied to your project, so modify freely
2. **Using className overrides** - Pass custom classes to any component
3. **Extending with variants** - Add your own variant props using `cva` or similar

## Dependencies

Components require these peer dependencies:

- `@flowsterix/headless` - Flowsterix headless hooks and utilities
- `motion` - Animation library (for animated components)
- `@floating-ui/dom` - Positioning (for popover/tooltip)
