import type {
  FlowDefinition,
  FlowState,
  FlowVersion,
  MigrationContext,
  VersionCompareResult,
  VersionMismatchAction,
} from './types'

/**
 * Serializes FlowVersion to string format "major.minor" for storage.
 */
export const serializeVersion = (version: FlowVersion): string =>
  `${version.major}.${version.minor}`

/**
 * Parses version string back to FlowVersion object.
 * Used for reading stored versions from storage.
 */
export const parseVersion = (versionStr: string): FlowVersion => {
  const parts = versionStr.split('.')
  if (parts.length === 2) {
    const major = parseInt(parts[0], 10)
    const minor = parseInt(parts[1], 10)
    if (!isNaN(major) && !isNaN(minor)) {
      return { major, minor }
    }
  }

  console.warn(`[tour][version] Invalid version string: "${versionStr}", defaulting to 0.0`)
  return { major: 0, minor: 0 }
}

/**
 * Compares two versions and returns the type of difference.
 */
export const compareVersions = (
  stored: FlowVersion,
  current: FlowVersion,
): VersionCompareResult => {
  if (stored.major === current.major && stored.minor === current.minor) {
    return 'same'
  }
  if (stored.major !== current.major) {
    return 'major'
  }
  return 'minor'
}

/**
 * Builds a map of step ID to index for the given flow definition.
 */
export const buildStepIdMap = <TContent>(
  definition: FlowDefinition<TContent>,
): Map<string, number> => {
  const map = new Map<string, number>()
  definition.steps.forEach((step, index) => {
    map.set(step.id, index)
  })
  return map
}

export interface VersionMigrationResult {
  state: FlowState
  action: VersionMismatchAction
}

/**
 * Handles version mismatch by attempting migration or reset.
 *
 * Strategy:
 * - 'same': Return stored state unchanged
 * - 'minor': Try to match by stepId, fallback to stepIndex
 * - 'major': Call migrate() if present, else reset
 *
 * For terminal states (completed/cancelled), preserve status regardless of version.
 */
export const handleVersionMismatch = <TContent>(params: {
  storedState: FlowState
  storedVersion: FlowVersion
  definition: FlowDefinition<TContent>
  currentVersion: FlowVersion
  stepIdMap: Map<string, number>
  now: () => number
}): VersionMigrationResult => {
  const {
    storedState,
    storedVersion,
    definition,
    currentVersion,
    stepIdMap,
    now,
  } = params

  const comparison = compareVersions(storedVersion, currentVersion)

  // Same version - no migration needed
  if (comparison === 'same') {
    return {
      state: storedState,
      action: 'continued',
    }
  }

  // Terminal states (completed/cancelled) are preserved
  if (storedState.status === 'completed' || storedState.status === 'cancelled') {
    return {
      state: {
        ...storedState,
        version: serializeVersion(currentVersion),
      },
      action: 'continued',
    }
  }

  // For idle state, just update version
  if (storedState.status === 'idle' || storedState.stepIndex < 0) {
    return {
      state: {
        ...storedState,
        version: serializeVersion(currentVersion),
        stepIndex: -1,
      },
      action: 'continued',
    }
  }

  // Minor mismatch: try step ID matching
  if (comparison === 'minor') {
    const resolvedState = resolveMinorMismatch({
      storedState,
      currentVersion,
      stepIdMap,
      definition,
    })
    if (resolvedState) {
      return { state: resolvedState, action: 'continued' }
    }
    // Step not found in new definition - reset
    return {
      state: createResetState(currentVersion, now),
      action: 'reset',
    }
  }

  // Major mismatch: try migrate function, else reset
  if (definition.migrate) {
    const migrationCtx: MigrationContext<TContent> = {
      oldState: storedState,
      oldVersion: storedVersion,
      newVersion: currentVersion,
      stepIdMap,
      definition,
    }

    try {
      const migrated = definition.migrate(migrationCtx)
      if (migrated) {
        return {
          state: {
            ...migrated,
            version: serializeVersion(currentVersion),
          },
          action: 'migrated',
        }
      }
    } catch (error) {
      console.warn('[tour][version] Migration function threw error', error)
    }
  }

  // Reset as fallback
  return {
    state: createResetState(currentVersion, now),
    action: 'reset',
  }
}

/**
 * Attempts to resolve a minor version mismatch by finding the step by ID.
 */
const resolveMinorMismatch = <TContent>(params: {
  storedState: FlowState
  currentVersion: FlowVersion
  stepIdMap: Map<string, number>
  definition: FlowDefinition<TContent>
}): FlowState | null => {
  const { storedState, currentVersion, stepIdMap, definition } = params

  // Try to find step by stored stepId
  if (storedState.stepId) {
    const newIndex = stepIdMap.get(storedState.stepId)
    if (newIndex !== undefined) {
      return {
        ...storedState,
        stepIndex: newIndex,
        version: serializeVersion(currentVersion),
      }
    }
  }

  // Fallback: check if stepIndex is still valid
  if (storedState.stepIndex >= 0 && storedState.stepIndex < definition.steps.length) {
    return {
      ...storedState,
      version: serializeVersion(currentVersion),
      stepId: definition.steps[storedState.stepIndex].id,
    }
  }

  // Step no longer exists
  return null
}

/**
 * Creates a fresh reset state.
 */
const createResetState = (version: FlowVersion, now: () => number): FlowState => ({
  status: 'idle',
  stepIndex: -1,
  version: serializeVersion(version),
  updatedAt: now(),
})
