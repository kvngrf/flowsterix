---
name: getting-started
description: Installation, first tour setup, and minimal working example for Flowsterix. Use when setting up Flowsterix, creating a tour, adding onboarding flows, or configuring CSS variables.
metadata:
  sources:
    - docs/guides/routing-and-async.md
---

# Flowsterix Getting Started

Flowsterix is a state machine-based guided tour library for React. Flows are declarative step sequences with automatic progression rules, lifecycle hooks, and persistence.

## Installation

```bash
# Core packages
npm install @flowsterix/core @flowsterix/react motion

# Recommended: Add preconfigured shadcn components
npx shadcn@latest add https://flowsterix.com/r/tour-hud.json

# Optional: Wire AI skills into your coding assistant
npx @tanstack/intent install
# Re-run after npm update to pick up new and updated skills
```

**Prefer the shadcn components** - they provide polished, accessible UI out of the box.

### Available Shadcn Components

| Component | Install Command |
|-----------|----------------|
| `tour-hud` | `npx shadcn@latest add https://flowsterix.com/r/tour-hud.json` |
| `step-content` | `npx shadcn@latest add https://flowsterix.com/r/step-content.json` |
| `mobile-drawer` | `npx shadcn@latest add https://flowsterix.com/r/mobile-drawer.json` |
| `mobile-drawer-handle` | `npx shadcn@latest add https://flowsterix.com/r/mobile-drawer-handle.json` |

## Minimal Example

```tsx
import { createFlow, type FlowDefinition } from '@flowsterix/core'
import { TourProvider, TourHUD } from '@flowsterix/react'
import type { ReactNode } from 'react'

const onboardingFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'onboarding',
  version: { major: 1, minor: 0 },
  autoStart: true,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      advance: [{ type: 'manual' }],
      content: <p>Welcome to our app!</p>,
    },
    {
      id: 'feature',
      target: { selector: '[data-tour-target="main-feature"]' },
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: <p>Click this button to continue</p>,
    },
  ],
})

export function App({ children }) {
  return (
    <TourProvider flows={[onboardingFlow]} storageNamespace="my-app">
      <TourHUD overlay={{ showRing: true }} />
      {children}
    </TourProvider>
  )
}
```

## CSS Setup

The shadcn tour components require specific CSS variables. If you already use shadcn/ui, you likely have all required variables.

### Required Variables

- `--background` / `--foreground` - Base colors
- `--popover` / `--popover-foreground` - Popover panel
- `--border` / `--input` - Border colors
- `--accent` / `--accent-foreground` - Hover states
- `--destructive` - Skip button hold state
- `--ring` - Focus rings

### Minimal Setup (Tailwind v4)

```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-ring: var(--ring);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

### Hex Fallback (Non-oklch)

```css
:root {
  --background: #ffffff;
  --foreground: #09090b;
  --popover: #ffffff;
  --popover-foreground: #09090b;
  --border: rgba(0, 0, 0, 0.1);
  --input: rgba(0, 0, 0, 0.1);
  --accent: #f4f4f5;
  --accent-foreground: #09090b;
  --destructive: #dc2626;
  --ring: rgba(0, 0, 0, 0.2);
}
```

## Common CSS Issues

- **Transparent popover**: Missing `--popover` variable. Add `--popover: #ffffff` (light) / `--popover: #18181b` (dark).
- **Skip button not red**: Missing `--destructive`. Add `--destructive: #dc2626`.
- **Mismatched button borders**: Ensure both `--border` and `--input` are defined.

## Step Content Primitives

Use these components for consistent step styling:

```tsx
import {
  StepContent,
  StepTitle,
  StepText,
  StepHint,
} from '@/components/step-content'

content: (
  <StepContent>
    <StepTitle>Feature Discovery</StepTitle>
    <StepText>This is the main explanation text.</StepText>
    <StepHint>Click the button to continue.</StepHint>
  </StepContent>
)
```

- `StepContent` - Grid container with proper spacing
- `StepTitle` - Semibold heading (supports `size="lg"` for welcome screens)
- `StepText` - Muted paragraph text
- `StepHint` - Italic hint text for user instructions
