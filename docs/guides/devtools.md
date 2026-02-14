# DevTools

The Flowsterix DevTools provide a development-only UI for debugging tours, managing flow state, and capturing selectors across pages.

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

- **Step list** - Captured target steps with selector, source, and URL
- **Step naming** - Rename steps inline to keep multi-step and cross-page flows organized
- **Drag-and-drop** - Reorder steps during development
- **Export/Copy JSON** - Share captured data with AI or tooling

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
3. Click an element to capture a step entry
4. Each entry stores selector, page URL, element context, and source metadata
5. Rename entries so reordering remains clear when steps span multiple routes

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
