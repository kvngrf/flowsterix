---
name: flow-patterns
description: Step definitions, targeting, advance rules, and waitFor patterns
---

# Flow Patterns

## Step Targets

### Screen Target (No Highlight)

```tsx
{
  id: 'welcome',
  target: 'screen',
  content: <WelcomeMessage />,
}
```

Use for intro/outro steps or when no specific element should be highlighted.

### Selector Target

```tsx
{
  id: 'feature',
  target: {
    selector: '[data-tour-target="feature-card"]',
    description: 'Feature card for debugging',
  },
}
```

**Best practice**: Always use `data-tour-target` attributes for stability.

### Dynamic Node Target

```tsx
{
  id: 'dynamic',
  target: {
    getNode: () => document.querySelector('.dynamic-element'),
    description: 'Dynamically resolved element',
  },
}
```

Use when the element is created dynamically or needs runtime resolution.

## Advance Rules

### Manual (Default)

```tsx
advance: [{ type: 'manual' }]
```

User must click Next button. Safe default for most steps.

### Event-Based

```tsx
// Click on target element
advance: [{ type: 'event', event: 'click', on: 'target' }]

// Any click on document
advance: [{ type: 'event', event: 'click', on: 'document' }]

// Custom selector
advance: [{ type: 'event', event: 'submit', on: '#my-form' }]

// Window events
advance: [{ type: 'event', event: 'resize', on: 'window' }]
```

### Delay (Timer)

```tsx
advance: [{ type: 'delay', ms: 3000 }]
```

Auto-advance after 3 seconds. Use `useDelayAdvance()` hook for countdown UI.

### Route Change

```tsx
// Advance when user navigates to specific route
advance: [{ type: 'route', to: '/dashboard' }]

// Regex matching
advance: [{ type: 'route', to: /^\/settings/ }]

// Any route change
advance: [{ type: 'route' }]
```

### Predicate (Polling)

```tsx
advance: [{
  type: 'predicate',
  check: (ctx) => document.querySelector('.loaded') !== null,
  pollMs: 250,      // Check every 250ms (default)
  timeoutMs: 10000, // Give up after 10s (optional)
}]
```

### Combining Rules

```tsx
// First matching rule triggers advance
advance: [
  { type: 'event', event: 'click', on: 'target' },
  { type: 'delay', ms: 10000 },  // Fallback
]
```

### Lock Back Navigation

```tsx
advance: [{ type: 'manual', lockBack: true }]
```

Prevents user from going back after reaching this step.

## waitFor Patterns

Block step until condition is met before showing popover.

### Selector Wait

```tsx
{
  id: 'api-result',
  target: { selector: '[data-tour-target="result-item"]' },
  waitFor: {
    selector: '[data-tour-target="result-item"]',
    timeout: 8000,  // Max wait time (default: 8000ms)
  },
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
{
  id: 'below-fold',
  target: { selector: '#feature-section' },
  targetBehavior: {
    scrollMargin: { top: 80 },  // Offset for sticky header
    scrollMode: 'start',        // 'start' | 'center' | 'preserve'
  },
}
```

### Hidden Target Handling

```tsx
targetBehavior: {
  hidden: 'screen',      // Show screen overlay if target not visible
  // or
  hidden: 'skip',        // Skip to next step if target hidden
  hiddenDelayMs: 1000,   // Wait before fallback
}
```

## Step Mask Options

```tsx
// Highlight hole (default)
mask: 'hole'

// No mask overlay
mask: 'none'

// Custom padding/radius
mask: { padding: 16, radius: 8 }
```

## Step Controls

```tsx
// Hide back button on final step
controls: { back: 'hidden' }

// Disable next button (use advance rules instead)
controls: { next: 'disabled' }

// Values: 'auto' | 'hidden' | 'disabled'
```

## Route-Scoped Steps

```tsx
{
  id: 'dashboard-feature',
  route: '/dashboard',           // Only show on this route
  // or
  route: /^\/dashboard\//,       // Regex match
  target: { selector: '[data-tour-target="widget"]' },
}
```

Step only activates when user is on matching route.
