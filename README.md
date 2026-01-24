# Flowsterix

Guided tours and onboarding flows for React applications. State machine-based, fully typed, with built-in persistence.

## Getting Started

### 1. Install the packages

```bash
npm install @flowsterix/core @flowsterix/react motion @floating-ui/dom
```

### 2. Add UI components via shadcn

```bash
npx shadcn@latest add https://flowsterix.com/r/tour-hud.json
```

This installs the complete tour HUD with overlay, popover, controls, and progress indicator.

### 3. Define your first flow

```tsx
import { createFlow } from '@flowsterix/core'

export const onboardingFlow = createFlow({
  id: 'onboarding',
  version: { major: 1, minor: 0 },
  autoStart: true,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: <p>Welcome! Let us show you around.</p>,
    },
    {
      id: 'feature',
      target: { selector: '[data-tour-target="main-feature"]' },
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: <p>Click this button to continue.</p>,
    },
  ],
})
```

### 4. Add to your app

```tsx
import { TourProvider } from '@flowsterix/react'
import { TourHUD } from '@/components/tour-hud'
import { onboardingFlow } from './flows'

export function App({ children }) {
  return (
    <TourProvider flows={[onboardingFlow]} storageNamespace="my-app">
      <TourHUD />
      {children}
    </TourProvider>
  )
}
```

### 5. Add target attributes to your elements

```tsx
<button data-tour-target="main-feature">Get Started</button>
```

That's it. Your tour is ready.

---

## Using with AI Assistants

Install the Flowsterix skill to help AI agents implement tours in your codebase:

```bash
npx add-skill kvngrf/flowsterix
```

The skill provides patterns for step definitions, advance rules, lifecycle hooks, router integration, and more. Works with Claude Code, Cursor, and other AI coding assistants.

---

## Features

- **Declarative flows** - Define steps with targets, content, and progression rules
- **5 advance rule types** - Manual, event, delay, route, predicate
- **Lifecycle hooks** - onEnter, onResume, onExit for UI synchronization
- **Persistence** - localStorage, API, or custom storage adapters
- **Versioning** - Semantic versions with migration support
- **Router integration** - TanStack Router, React Router, Next.js App/Pages
- **Accessibility** - Focus trapping, keyboard navigation, ARIA labels
- **Analytics hooks** - Event system for integrating with your tracking

## Documentation

| Guide | Description |
|-------|-------------|
| [Storage Adapters](docs/guides/storage-adapters.md) | Persist state to localStorage, API, or custom backends |
| [Versioning](docs/guides/versioning.md) | Handle flow updates and migrations |
| [Accessibility](docs/guides/accessibility.md) | Focus management, ARIA, reduced motion |
| [Routing](docs/guides/routing.md) | Router adapter setup and route-based steps |
| [Headless Mode](docs/guides/headless.md) | Build custom UIs with Flowsterix hooks |

## Shadcn Components

All UI components are available via the [shadcn registry](https://flowsterix.com):

```bash
# Individual components
npx shadcn@latest add https://flowsterix.com/r/tour-provider.json
npx shadcn@latest add https://flowsterix.com/r/tour-overlay.json
npx shadcn@latest add https://flowsterix.com/r/tour-controls.json
npx shadcn@latest add https://flowsterix.com/r/tour-progress.json

# Complete HUD (recommended)
npx shadcn@latest add https://flowsterix.com/r/tour-hud.json

# Example flow
npx shadcn@latest add https://flowsterix.com/r/onboarding-flow.json
```

## Examples

This repo includes example apps for different frameworks:

```bash
pnpm dev:react-vite     # TanStack Router
pnpm dev:react-router   # React Router v6
pnpm dev:next           # Next.js App Router
pnpm dev:shadcn         # shadcn component demo
```

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 15+

## License

MIT

---

## Development

```bash
# Install dependencies
pnpm install

# Run example app
pnpm dev

# Run tests
pnpm test        # Unit tests
pnpm test:e2e    # Playwright E2E tests

# Build packages
pnpm build

# Lint and format
pnpm lint
pnpm format
```
