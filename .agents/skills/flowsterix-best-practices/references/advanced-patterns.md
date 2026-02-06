---
name: advanced-patterns
description: Version management, storage adapters, migrations, and lifecycle hooks
---

# Advanced Patterns

## Version Management

Flowsterix uses semantic versioning for flow definitions to handle storage migrations.

### Version Object

```tsx
version: { major: 1, minor: 0 }
```

- **major**: Increment for breaking changes (steps restructured, removed, IDs changed)
- **minor**: Increment for additive changes (content updates, new optional steps)

### What Triggers Version Handling

| Stored Version | Current Version | Action |
|---------------|-----------------|--------|
| 1.0 | 1.0 | Resume from stored step |
| 1.0 | 1.1 | Minor bump - try step ID matching |
| 1.0 | 2.0 | Major bump - call `migrate()` or reset |

### Migration Function

```tsx
const flow = createFlow({
  id: 'onboarding',
  version: { major: 2, minor: 0 },
  steps: [
    { id: 'welcome', ... },
    { id: 'new-feature', ... },  // New step in v2
    { id: 'finish', ... },
  ],
  migrate: (ctx) => {
    // ctx.oldState: Previous FlowState
    // ctx.oldVersion: { major: 1, minor: 0 }
    // ctx.newVersion: { major: 2, minor: 0 }
    // ctx.stepIdMap: Map<stepId, newIndex>
    // ctx.definition: Current flow definition

    // Map old step to new position
    const oldStepId = ctx.oldState.stepId
    if (oldStepId && ctx.stepIdMap.has(oldStepId)) {
      return {
        ...ctx.oldState,
        stepIndex: ctx.stepIdMap.get(oldStepId)!,
        version: '2.0',
      }
    }

    // Return null to reset flow
    return null
  },
})
```

### Version Mismatch Callback

```tsx
<TourProvider
  flows={flows}
  onVersionMismatch={(info) => {
    // info.flowId
    // info.oldVersion, info.newVersion
    // info.action: 'continued' | 'migrated' | 'reset'
    // info.resolvedStepId, info.resolvedStepIndex
    console.log(`Flow ${info.flowId} migrated: ${info.action}`)
  }}
/>
```

## Storage Adapters

### Memory Storage (Default)

```tsx
import { MemoryStorageAdapter } from '@flowsterix/core'

<TourProvider
  flows={flows}
  storageAdapter={new MemoryStorageAdapter()}
/>
```

No persistence - state resets on page reload.

### LocalStorage Adapter

```tsx
import { createLocalStorageAdapter } from '@flowsterix/core'

<TourProvider
  flows={flows}
  storageAdapter={createLocalStorageAdapter()}
  storageNamespace="my-app"  // Key prefix: "my-app:flowId"
/>
```

Persists state in browser localStorage.

### API Storage Adapter

```tsx
import { createApiStorageAdapter } from '@flowsterix/core'

const apiAdapter = createApiStorageAdapter({
  baseUrl: '/api/tour-state',
  getHeaders: () => ({
    'Authorization': `Bearer ${getToken()}`,
  }),
})

<TourProvider
  flows={flows}
  storageAdapter={apiAdapter}
/>
```

Expected API endpoints:
- `GET /api/tour-state/{key}` - Retrieve state
- `PUT /api/tour-state/{key}` - Save state
- `DELETE /api/tour-state/{key}` - Remove state

### Custom Storage Adapter

```tsx
interface StorageAdapter {
  get(key: string): StorageSnapshot | null | Promise<StorageSnapshot | null>
  set(key: string, value: StorageSnapshot): void | Promise<void>
  remove(key: string): void | Promise<void>
  subscribe?(listener: () => void): () => void
}

interface StorageSnapshot {
  version: string      // "major.minor"
  value: FlowState
  updatedAt: number    // timestamp
}

// Example: IndexedDB adapter
const idbAdapter: StorageAdapter = {
  async get(key) {
    const db = await openDB()
    return db.get('tours', key)
  },
  async set(key, value) {
    const db = await openDB()
    await db.put('tours', value, key)
  },
  async remove(key) {
    const db = await openDB()
    await db.delete('tours', key)
  },
}
```

## Lifecycle Hooks Deep Dive

### Hook Execution Order

```
Flow Start → onEnter (step 0)
Step Advance → onExit (step 0) → onEnter (step 1)
Flow Complete → onExit (last step)
Flow Cancel → onExit (current step)
```

### Resume Strategies

```tsx
// 'current' - Only run current step's onResume
resumeStrategy: 'current'

// 'chain' - Run onResume for ALL steps up to current
resumeStrategy: 'chain'
```

**chain** is useful when each step sets up state that later steps depend on.

### Hook Context

```tsx
onEnter: (ctx) => {
  ctx.flow      // FlowDefinition
  ctx.state     // FlowState { status, stepIndex, version, ... }
  ctx.step      // Current Step
}
```

### Async Hooks

```tsx
onEnter: async (ctx) => {
  await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({ stepId: ctx.step.id }),
  })
}
```

Hooks are awaited. Errors are caught and logged, don't crash the flow.

### UI Sync Pattern

**For Radix dialogs, use the declarative `useRadixTourDialog` hook:**

```tsx
import { useRadixTourDialog } from '@flowsterix/react'

// In your dialog component:
function SettingsDialog({ children }) {
  const { dialogProps, contentProps } = useRadixTourDialog({ dialogId: 'settings' })
  return (
    <Dialog.Root {...dialogProps}>
      <Dialog.Content {...contentProps}>{children}</Dialog.Content>
    </Dialog.Root>
  )
}

// In your flow definition:
const flow = createFlow({
  dialogs: {
    settings: {
      onDismissGoToStepId: 'settings-trigger',
    },
  },
  steps: [
    { id: 'settings-trigger', target: '#btn', content: '...' },
    { id: 'dialog-step', dialogId: 'settings', target: '#tab', content: '...' },
  ],
})
```

**For other UI elements (menus, accordions), use `waitForDom()` with lifecycle hooks:**

```tsx
import { waitForDom } from '@flowsterix/react'

const ensureMenuOpen = async () => {
  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (panel?.getAttribute('data-state') === 'open') return

  document.querySelector('[data-tour-target="menu-trigger"]')?.click()
  await waitForDom()
}

// In step definition:
{
  id: 'menu-item',
  target: { selector: '[data-tour-target="menu-item"]' },
  onEnter: ensureMenuOpen,
  onResume: ensureMenuOpen,
  onExit: ensureMenuClosed,
}
```

## Event System

### EventBus Usage

```tsx
const { events } = useTour()

// Subscribe
const unsubscribe = events?.on('stepEnter', (payload) => {
  console.log('Entered:', payload.currentStep.id)
})

// One-time listener
events?.once('flowComplete', (payload) => {
  confetti()
})

// Unsubscribe
unsubscribe?.()

// Clear all listeners
events?.clear()
```

### Typed Analytics

```tsx
<TourProvider
  flows={flows}
  analytics={{
    onFlowStart: ({ flow, state }) => {
      analytics.track('tour_started', {
        flowId: flow.id,
        version: state.version,
      })
    },
    onStepEnter: ({ currentStep, reason }) => {
      analytics.track('step_viewed', {
        stepId: currentStep.id,
        reason,
      })
    },
    onFlowComplete: ({ flow }) => {
      analytics.track('tour_completed', { flowId: flow.id })
    },
    onFlowCancel: ({ flow, reason }) => {
      analytics.track('tour_cancelled', {
        flowId: flow.id,
        reason,
      })
    },
  }}
/>
```

## Debug Mode

```tsx
const { debugEnabled, toggleDebug } = useTour()

// Enable in development
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    toggleDebug()
  }
}, [])
```

Debug mode logs all state transitions and events to console.

## Error Handling

```tsx
useTourEvents('flowError', (payload) => {
  // payload.code: 'storage.persist_failed' | 'flow.step_not_found' | ...
  // payload.error: Error object
  // payload.meta: Additional context

  Sentry.captureException(payload.error, {
    tags: { flowId: payload.flow.id, errorCode: payload.code },
  })
})
```

### Error Codes

| Code | Meaning |
|------|---------|
| `storage.persist_failed` | Could not save state |
| `storage.hydrate_failed` | Could not load state |
| `flow.step_not_found` | goToStep with invalid ID |
| `flow.migration_failed` | migrate() threw error |
| `async.schedule_failed` | Async operation failed |
| `dialog.not_mounted` | Step references dialogId but no dialog mounted with that ID |

## FlowState Reference

```tsx
interface FlowState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled'
  stepIndex: number        // -1 before start
  version: string          // "major.minor"
  stepId?: string          // Current step ID
  updatedAt: number        // Timestamp
  cancelReason?: 'skipped' | 'keyboard'
}
```
