---
name: lifecycle-hooks
description: Lifecycle hooks (onEnter, onResume, onExit) for synchronizing UI state with tour progression in Flowsterix. Use when targeting elements inside collapsible panels, modals, drawers, accordions, or other dynamic UI during tours.
metadata:
  sources:
    - docs/guides/routing-and-async.md
---

# Lifecycle Hooks

Lifecycle hooks synchronize UI state with tour progression. **Use them when steps target elements inside collapsible panels, modals, drawers, or other dynamic UI.**

## When to Use Each Hook

| Hook | Fires When | Purpose |
|------|-----------|---------|
| `onEnter` | Step activates (fresh start) | Open UI, prepare state |
| `onResume` | Step restores from storage | Restore UI after page reload |
| `onExit` | Leaving step (next/back/skip) | Clean up, close UI |

## Hook Execution Order

```
Flow Start → onEnter (step 0)
Step Advance → onExit (step 0) → onEnter (step 1)
Flow Complete → onExit (last step)
Flow Cancel → onExit (current step)
```

## Hook Context

```tsx
onEnter: (ctx) => {
  ctx.flow      // FlowDefinition
  ctx.state     // FlowState { status, stepIndex, version, ... }
  ctx.step      // Current Step
}
```

Hooks are awaited. Errors are caught and logged — they don't crash the flow.

## Resume Strategies

```tsx
// 'current' - Only run current step's onResume
resumeStrategy: 'current'

// 'chain' - Run onResume for ALL steps up to current
resumeStrategy: 'chain'
```

**chain** is useful when each step sets up state that later steps depend on (e.g., step 1 opens sidebar, step 2 expands accordion inside sidebar).

## Common Patterns

### Opening/Closing Drawers & Menus

```tsx
import { waitForDom } from '@flowsterix/react'

const ensureMenuOpen = async () => {
  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (panel?.getAttribute('data-state') === 'open') return
  document.querySelector('[data-tour-target="menu-trigger"]')?.click()
  await waitForDom()
}

const ensureMenuClosed = () => {
  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return
  const isClosed = panel.classList.contains('-translate-x-full')
  if (!isClosed) {
    panel.querySelector('[aria-label="Close menu"]')?.click()
  }
}
```

### Step Targeting Element Inside Drawer

```tsx
{
  id: 'menu-link',
  target: { selector: '[data-tour-target="api-link"]' },
  onEnter: () => ensureMenuOpen(),
  onResume: () => ensureMenuOpen(),
  onExit: () => ensureMenuClosed(),
  advance: [{ type: 'route', to: '/api-demo' }],
  content: (
    <StepContent>
      <StepTitle>API Demo</StepTitle>
      <StepText>Click to explore the API features.</StepText>
    </StepContent>
  ),
}
```

### Expanding Nested Accordions

```tsx
const ensureAccordionExpanded = () => {
  ensureMenuOpen()  // Parent must be open first
  const submenu = document.querySelector('[data-tour-target="submenu"]')
  if (submenu) return  // Already expanded
  document.querySelector('[data-tour-target="accordion-toggle"]')?.click()
}

{
  id: 'submenu-item',
  target: { selector: '[data-tour-target="submenu"]' },
  onEnter: () => ensureAccordionExpanded(),
  onResume: () => ensureAccordionExpanded(),
  content: ...
}
```

### Closing UI When Moving Away

```tsx
{
  id: 'feature-grid',
  target: { selector: '#feature-grid' },
  onEnter: () => {
    setTimeout(() => ensureMenuClosed(), 0)  // Allow previous click to register
  },
  onResume: () => ensureMenuClosed(),
  content: ...
}
```

## Animated Container Targets

When a step targets an element inside a container that expands/collapses (sidebar, accordion), the coordinator **automatically waits** until the target is fully visible. No `waitFor` needed — ancestor-clip visibility detection is built in.

- After rect settles, checks if >=85% of element is visible (accounting for ancestor `overflow` clipping)
- Keeps highlight and popover suppressed (faded out) and retries each frame
- 3-second safety timeout

```tsx
{
  id: 'sidebar-item',
  target: { selector: '[data-tour-target="sidebar-settings"]' },
  onEnter: () => setSidebarOpen(true),
  content: <p>Click Settings to continue.</p>,
}
// Highlight appears only after sidebar finishes expanding
```

## Critical Rules

1. **Always implement `onResume` when you have `onEnter`** - Users may reload the page mid-tour
2. **Check state before acting** - Don't toggle already-open menus
3. **Use `setTimeout` for sequential actions** - Give previous clicks time to register
4. **Keep hooks idempotent** - Safe to call multiple times
