---
name: flow-definitions
description: Step definitions, element targeting, advance rules, waitFor patterns, and target behavior in Flowsterix. Use when defining tour steps, targeting elements, configuring advance rules, or handling async content.
metadata:
  sources:
    - docs/guides/routing-and-async.md
---

# Flow Definitions

## FlowDefinition

```tsx
createFlow({
  id: string,                                  // Unique identifier
  version: { major: number, minor: number },   // For storage migrations
  steps: Step[],                               // Array of tour steps
  dialogs?: Record<string, DialogConfig>,       // Dialog configurations
  autoStart?: boolean,                         // Start on mount (default: false)
  resumeStrategy?: 'chain' | 'current',        // How to run onResume hooks
  hud?: FlowHudOptions,                        // UI configuration
  migrate?: (ctx) => FlowState | null,         // Version migration handler
})
```

## Step Anatomy

```tsx
{
  id: string,                    // Unique within flow
  target: StepTarget,            // What to highlight
  content: ReactNode,            // Popover content
  dialogId?: string,             // Reference to flow.dialogs entry
  advance?: AdvanceRule[],       // When to move to next step
  placement?: StepPlacement,     // Popover position
  route?: string | RegExp,       // Only show on matching routes
  waitFor?: StepWaitFor,         // Block until condition met
  targetBehavior?: StepTargetBehavior,
  onEnter?: (ctx) => void,       // Fires when step activates
  onResume?: (ctx) => void,      // Fires when resuming from storage
  onExit?: (ctx) => void,        // Fires when leaving step
  controls?: { back?, next? },   // Button visibility
}
```

## Step Targets

```tsx
// Full-screen overlay (no element highlight)
target: 'screen'

// CSS selector (recommended: use data attributes)
target: { selector: '[data-tour-target="feature"]' }

// With description for debugging
target: { selector: '[data-tour-target="feature"]', description: 'Feature card' }

// Dynamic node resolution
target: { getNode: () => document.querySelector('.dynamic-el') }
```

**Always use `data-tour-target` attributes** instead of CSS classes for stability:

```tsx
// Bad: fragile to styling changes
target: { selector: '.btn-primary' }

// Good: semantic and stable
target: { selector: '[data-tour-target="submit-btn"]' }
```

## Advance Rules

Rules define when a step automatically progresses. First matching rule wins.

### Manual (Default)

```tsx
advance: [{ type: 'manual' }]
```

### Event-Based

```tsx
advance: [{ type: 'event', event: 'click', on: 'target' }]
advance: [{ type: 'event', event: 'click', on: 'document' }]
advance: [{ type: 'event', event: 'submit', on: '#my-form' }]
advance: [{ type: 'event', event: 'resize', on: 'window' }]
```

### Delay (Timer)

```tsx
advance: [{ type: 'delay', ms: 3000 }]
```

Use `useDelayAdvance()` hook for countdown UI.

### Route Change

```tsx
advance: [{ type: 'route', to: '/dashboard' }]
advance: [{ type: 'route', to: /^\/settings/ }]
advance: [{ type: 'route' }]  // Any route change
```

### Predicate (Polling)

```tsx
advance: [{
  type: 'predicate',
  check: (ctx) => document.querySelector('.loaded') !== null,
  pollMs: 250,
  timeoutMs: 10000,
}]
```

### Combining Rules

```tsx
// First matching rule triggers advance
advance: [
  { type: 'event', event: 'click', on: 'target' },
  { type: 'delay', ms: 10000 },  // Fallback after 10s
]
```

### Lock Back Navigation

```tsx
advance: [{ type: 'manual', lockBack: true }]
```

## waitFor Patterns

Block step until condition is met before showing popover.

### Selector Wait

```tsx
waitFor: {
  selector: '[data-tour-target="result-item"]',
  timeout: 8000,
}
```

### Predicate Wait

```tsx
waitFor: {
  predicate: async (ctx) => {
    const response = await fetch('/api/status')
    return response.ok
  },
  pollMs: 500,
  timeout: 15000,
}
```

### Custom Subscribe

```tsx
waitFor: {
  subscribe: (ctx) => {
    const handler = () => ctx.notify(true)
    window.addEventListener('data-loaded', handler)
    return () => window.removeEventListener('data-loaded', handler)
  },
  timeout: 10000,
}
```

## Target Behavior

### Scroll Margin (Sticky Headers)

```tsx
targetBehavior: {
  scrollMargin: { top: 80 },   // Offset for sticky header
  scrollMode: 'start',         // 'start' | 'center' | 'preserve'
  scrollDurationMs: 350,       // Fixed smooth-scroll timing
}
```

### Long Jump Synchronization

When consecutive steps are far apart, set `scrollDurationMs`:

```tsx
targetBehavior: {
  scrollMode: 'center',
  scrollDurationMs: 350,
}
```

- Use 250-450ms for most pages. Start with 350ms.
- Overlay highlight and popover **fade out** at current position, scroll to new target, then **fade in** at new position.
- When `scrollDurationMs` is set, Flowsterix temporarily bypasses global CSS smooth scrolling for deterministic timing.

### Hidden Target Handling

```tsx
targetBehavior: {
  hidden: 'screen',       // Show screen overlay if target not visible
  hidden: 'skip',         // Skip to next step
  hiddenDelayMs: 1000,    // Wait before fallback
}
```

## Step Mask Options

```tsx
mask: 'hole'               // Highlight hole (default)
mask: 'none'               // No mask overlay
mask: { padding: 16, radius: 8 }  // Custom
```

## Step Controls

```tsx
controls: { back: 'hidden' }     // Hide back button
controls: { next: 'disabled' }   // Disable next
// Values: 'auto' | 'hidden' | 'disabled'
```

## Placements

```
'auto' | 'top' | 'bottom' | 'left' | 'right' |
'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' |
'left-start' | 'left-end' | 'right-start' | 'right-end' |
'auto-start' | 'auto-end'
```

## Common Mistakes

1. **Missing `data-tour-target` attributes** - Use `data-tour-target` instead of CSS classes for selector stability.

2. **No `waitFor` for async content** - Step shows before element exists:
   ```tsx
   waitFor: { selector: '[data-tour-target="api-result"]', timeout: 8000 }
   ```

3. **Wrong version format** - Use object, not number:
   ```tsx
   // Bad
   version: 1
   // Good
   version: { major: 1, minor: 0 }
   ```

4. **Ignoring sticky headers** - Target scrolls behind fixed navigation:
   ```tsx
   targetBehavior: { scrollMargin: { top: 80 }, scrollMode: 'start' }
   ```
