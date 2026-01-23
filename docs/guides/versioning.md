# Flow Versioning

Flowsterix uses semantic versioning to manage flow state across deployments. When you update a flow definition, the versioning system determines how to handle users who were mid-flow with the old version.

## Version Format

Versions use a `{ major, minor }` object format:

```tsx
const flow = createFlow({
  id: 'onboarding',
  version: { major: 1, minor: 0 },
  steps: [...]
})
```

## Version Semantics

| Version Change | Meaning | Default Behavior |
|---------------|---------|------------------|
| **Major** (1.0 → 2.0) | Breaking change: steps restructured, removed, or IDs changed | Reset flow, call `migrate` if provided |
| **Minor** (1.0 → 1.1) | Non-breaking: content tweaks, new optional steps | Continue at same step |

## What Happens on Version Mismatch

When a user returns with stored progress from a different version:

### Minor Changes (1.0 → 1.1 or 1.1 → 1.0)

The system attempts to preserve progress:

1. **Step ID matching**: Finds the user's current step by its `id` in the new definition
2. **Index fallback**: If the step ID isn't found but the index is valid, continues at that index
3. **Reset**: If the step no longer exists, resets to idle

```tsx
// User was on step "upload" (index 2) with version 1.0
// New version 1.1 reordered steps, "upload" is now index 3
// → User continues at index 3 (matched by step ID)
```

### Major Changes (1.0 → 2.0)

1. **Migration function**: If provided, attempts to migrate the state
2. **Reset**: If no migration or migration returns null, resets to idle

## Migration Functions

For major version changes, provide a `migrate` function to handle state transitions:

```tsx
const flow = createFlow({
  id: 'onboarding',
  version: { major: 2, minor: 0 },
  migrate: ({ oldState, oldVersion, newVersion, stepIdMap }) => {
    // Map old step IDs to new ones
    const stepMapping: Record<string, string> = {
      'old-welcome': 'new-welcome',
      'old-profile': 'profile-setup',
    }

    const oldStepId = oldState.stepId
    if (!oldStepId) return null // Reset if no step ID

    const newStepId = stepMapping[oldStepId]
    if (!newStepId) return null // Reset if unmapped

    const newIndex = stepIdMap.get(newStepId)
    if (newIndex === undefined) return null // Reset if step not found

    return {
      ...oldState,
      stepIndex: newIndex,
      stepId: newStepId,
      version: `${newVersion.major}.${newVersion.minor}`,
    }
  },
  steps: [...]
})
```

### Migration Context

The `migrate` function receives:

| Property | Type | Description |
|----------|------|-------------|
| `oldState` | `FlowState` | The stored state from the previous version |
| `oldVersion` | `FlowVersion` | The version when the state was saved |
| `newVersion` | `FlowVersion` | The current flow definition version |
| `stepIdMap` | `Map<string, number>` | Maps step IDs to their indices in the new definition |
| `definition` | `FlowDefinition` | The current flow definition |

Return the migrated `FlowState` or `null` to trigger a reset.

## Handling Version Events

Listen for version mismatches via the `onVersionMismatch` callback:

```tsx
<TourProvider
  flows={flows}
  onVersionMismatch={({ flowId, oldVersion, newVersion, action }) => {
    console.log(`Flow ${flowId}: ${oldVersion.major}.${oldVersion.minor} → ${newVersion.major}.${newVersion.minor}`)

    if (action === 'reset') {
      // Optionally notify the user
      toast('This tour has been updated. Starting fresh.')
    }
  }}
>
```

### Mismatch Actions

| Action | Meaning |
|--------|---------|
| `continued` | Progress preserved (same version or successful step matching) |
| `migrated` | Migration function successfully transformed the state |
| `reset` | State was cleared, flow will start from beginning |

## Event Bus

Version events are also emitted on the flow's event bus:

```tsx
store.events.on('versionMismatch', ({ flowId, oldVersion, newVersion, action }) => {
  // Track in analytics
  analytics.track('flow_version_mismatch', {
    flowId,
    from: `${oldVersion.major}.${oldVersion.minor}`,
    to: `${newVersion.major}.${newVersion.minor}`,
    action,
  })
})
```

## Terminal States

Completed and cancelled flows are preserved across version changes. A version bump does **not** re-show a completed flow. If you need to re-trigger a flow after a major update, you'll need to clear the stored state:

```tsx
// Clear a specific flow's state
storageAdapter.remove(`tour:onboarding`)
```

## Best Practices

### When to Bump Versions

| Change | Version Bump |
|--------|--------------|
| Fix typo in step content | Minor (1.0 → 1.1) |
| Add new optional step | Minor |
| Reorder existing steps | Minor (step IDs preserved) |
| Remove a step | Major (1.0 → 2.0) |
| Change step IDs | Major |
| Restructure flow logic | Major |

### Step ID Stability

Use stable, descriptive step IDs that won't need to change:

```tsx
// Good - descriptive and stable
{ id: 'welcome-intro', ... }
{ id: 'profile-setup', ... }
{ id: 'first-project', ... }

// Avoid - likely to need renaming
{ id: 'step1', ... }
{ id: 'intro', ... }  // too generic
```

### Testing Migrations

Before deploying a major version change:

1. Export sample states from your current version
2. Test your migration function with those states
3. Verify users land on the correct step

```tsx
// Test helper
const testMigration = (oldState: FlowState, flow: FlowDefinition) => {
  const stepIdMap = buildStepIdMap(flow)
  const result = flow.migrate?.({
    oldState,
    oldVersion: parseVersion(oldState.version),
    newVersion: normalizeVersion(flow.version),
    stepIdMap,
    definition: flow,
  })
  return result
}
```

