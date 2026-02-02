# DevTools

The Flowsterix DevTools provide a development-only UI for debugging tours, managing flow state, and capturing element selectors.

## Installation

DevTools are included in `@flowsterix/react` via a subpath export:

```tsx
import { DevToolsProvider } from '@flowsterix/react/devtools'
```

## Setup

Wrap your app content inside `TourProvider` with `DevToolsProvider`:

```tsx
import { TourProvider } from '@flowsterix/react'
import { DevToolsProvider } from '@flowsterix/react/devtools'

export function App({ children }) {
  return (
    <TourProvider flows={[onboardingFlow]} storageNamespace="my-app">
      <DevToolsProvider enabled={process.env.NODE_ENV === 'development'}>
        {children}
      </DevToolsProvider>
    </TourProvider>
  )
}
```

**Important:** `DevToolsProvider` must be a child of `TourProvider` to access flow context.

## Features

### Steps Tab

View and control the current flow's steps:

- **Step list** - All steps in the active flow with status indicators
- **Drag-and-drop** - Reorder steps during development
- **Jump to step** - Click any step to navigate directly to it
- **Active tracking** - Current step is highlighted

### Flows Tab

Manage all registered flows:

- **Flow list** - See all flows registered with TourProvider
- **Status badges** - Active, completed, not started
- **Step info** - Current step index and total steps
- **Edit JSON** - Modify flow state directly (useful for testing edge cases)
- **Delete** - Remove flow storage entry (cancels running flow first)

### Element Grabber

Capture CSS selectors for step targets:

1. Click the grabber icon in the DevTools panel
2. Hover over elements in your app - they highlight on hover
3. Click to copy the selector to clipboard
4. Use in your step definition: `target: { selector: '[data-tour-target="..."]' }`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Show/hide the DevTools panel |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Panel position |

## Tree Shaking

DevTools are in a separate entry point, so they won't be bundled in production if you:

1. Import from `@flowsterix/react/devtools` (not the main entry)
2. Conditionally render based on `process.env.NODE_ENV`

```tsx
// This tree-shakes correctly
{process.env.NODE_ENV === 'development' && (
  <DevToolsProvider>...</DevToolsProvider>
)}
```
