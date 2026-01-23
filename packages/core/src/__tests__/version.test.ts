import { describe, expect, it } from 'vitest'
import {
  buildStepIdMap,
  compareVersions,
  handleVersionMismatch,
  parseVersion,
  serializeVersion,
} from '../version'
import type { FlowDefinition, FlowState } from '../types'

describe('serializeVersion', () => {
  it('serializes FlowVersion to string', () => {
    expect(serializeVersion({ major: 1, minor: 0 })).toBe('1.0')
    expect(serializeVersion({ major: 2, minor: 3 })).toBe('2.3')
  })
})

describe('parseVersion', () => {
  it('parses "major.minor" string', () => {
    expect(parseVersion('1.0')).toEqual({ major: 1, minor: 0 })
    expect(parseVersion('2.5')).toEqual({ major: 2, minor: 5 })
  })

  it('handles invalid strings gracefully', () => {
    expect(parseVersion('invalid')).toEqual({ major: 0, minor: 0 })
  })
})

describe('compareVersions', () => {
  it('returns same for identical versions', () => {
    expect(compareVersions({ major: 1, minor: 0 }, { major: 1, minor: 0 })).toBe('same')
  })

  it('returns minor for same major, different minor', () => {
    expect(compareVersions({ major: 1, minor: 0 }, { major: 1, minor: 1 })).toBe('minor')
    expect(compareVersions({ major: 1, minor: 2 }, { major: 1, minor: 0 })).toBe('minor')
  })

  it('returns major for different major', () => {
    expect(compareVersions({ major: 1, minor: 0 }, { major: 2, minor: 0 })).toBe('major')
    expect(compareVersions({ major: 2, minor: 0 }, { major: 1, minor: 0 })).toBe('major')
  })
})

describe('buildStepIdMap', () => {
  it('creates map of step ID to index', () => {
    const flow: FlowDefinition<string> = {
      id: 'test',
      version: { major: 1, minor: 0 },
      steps: [
        { id: 'welcome', target: 'screen', content: 'Welcome' },
        { id: 'profile', target: 'screen', content: 'Profile' },
        { id: 'done', target: 'screen', content: 'Done' },
      ],
    }
    const map = buildStepIdMap(flow)
    expect(map.get('welcome')).toBe(0)
    expect(map.get('profile')).toBe(1)
    expect(map.get('done')).toBe(2)
    expect(map.get('nonexistent')).toBeUndefined()
  })
})

describe('handleVersionMismatch', () => {
  const createTestFlow = (steps: Array<{ id: string }>): FlowDefinition<string> => ({
    id: 'test',
    version: { major: 2, minor: 0 },
    steps: steps.map((s) => ({ ...s, target: 'screen' as const, content: '' })),
  })

  const createState = (
    override: Partial<FlowState> = {},
  ): FlowState => ({
    status: 'running',
    stepIndex: 1,
    version: '1.0',
    stepId: 'step-b',
    updatedAt: 1000,
    ...override,
  })

  const now = () => Date.now()

  it('returns same state for matching versions', () => {
    const flow = createTestFlow([{ id: 'step-a' }, { id: 'step-b' }])
    const state = createState({ version: '2.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 2, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('continued')
    expect(result.state).toEqual(state)
  })

  it('preserves terminal states (completed)', () => {
    const flow = createTestFlow([{ id: 'step-a' }])
    const state = createState({ status: 'completed', version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('continued')
    expect(result.state.status).toBe('completed')
    expect(result.state.version).toBe('2.0')
  })

  it('preserves terminal states (cancelled)', () => {
    const flow = createTestFlow([{ id: 'step-a' }])
    const state = createState({ status: 'cancelled', version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('continued')
    expect(result.state.status).toBe('cancelled')
  })

  it('matches step by ID for minor version changes', () => {
    const flow = createTestFlow([{ id: 'new-step' }, { id: 'step-b' }, { id: 'step-c' }])
    const state = createState({ stepIndex: 0, stepId: 'step-b', version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 1, minor: 1 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('continued')
    expect(result.state.stepIndex).toBe(1) // step-b is now at index 1
    expect(result.state.version).toBe('1.1')
  })

  it('falls back to stepIndex when stepId not found in minor change', () => {
    const flow = createTestFlow([{ id: 'step-a' }, { id: 'step-c' }])
    const state = createState({ stepIndex: 1, stepId: 'step-b', version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 1, minor: 1 },
      stepIdMap,
      now,
    })

    // For minor changes, we fall back to stepIndex if it's still valid
    expect(result.action).toBe('continued')
    expect(result.state.stepIndex).toBe(1)
    expect(result.state.stepId).toBe('step-c') // Updated to match new step at index 1
  })

  it('resets when stepIndex is also invalid in minor change', () => {
    const flow = createTestFlow([{ id: 'step-a' }]) // Only 1 step now
    const state = createState({ stepIndex: 2, stepId: 'step-b', version: '1.0' }) // Index 2 is out of bounds
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 1, minor: 1 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('reset')
    expect(result.state.status).toBe('idle')
    expect(result.state.stepIndex).toBe(-1)
  })

  it('resets on major version change without migrate', () => {
    const flow = createTestFlow([{ id: 'step-a' }, { id: 'step-b' }])
    const state = createState({ version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('reset')
    expect(result.state.status).toBe('idle')
  })

  it('calls migrate function on major version change', () => {
    const flow: FlowDefinition<string> = {
      id: 'test',
      version: { major: 2, minor: 0 },
      steps: [
        { id: 'new-welcome', target: 'screen', content: '' },
        { id: 'profile', target: 'screen', content: '' },
      ],
      migrate: ({ oldState, stepIdMap }) => {
        // Map old step to new step
        const newIndex = stepIdMap.get('profile')
        if (newIndex === undefined) return null
        return {
          ...oldState,
          stepIndex: newIndex,
          stepId: 'profile',
          version: '2.0',
        }
      },
    }

    const state = createState({
      stepIndex: 1,
      stepId: 'old-profile',
      version: '1.0',
    })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('migrated')
    expect(result.state.stepIndex).toBe(1)
    expect(result.state.stepId).toBe('profile')
  })

  it('resets when migrate returns null', () => {
    const flow: FlowDefinition<string> = {
      id: 'test',
      version: { major: 2, minor: 0 },
      steps: [{ id: 'step-a', target: 'screen', content: '' }],
      migrate: () => null,
    }

    const state = createState({ version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('reset')
    expect(result.state.status).toBe('idle')
  })

  it('resets when migrate throws', () => {
    const flow: FlowDefinition<string> = {
      id: 'test',
      version: { major: 2, minor: 0 },
      steps: [{ id: 'step-a', target: 'screen', content: '' }],
      migrate: () => {
        throw new Error('Migration failed')
      },
    }

    const state = createState({ version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('reset')
    expect(result.state.status).toBe('idle')
  })

  it('handles idle state by just updating version', () => {
    const flow = createTestFlow([{ id: 'step-a' }])
    const state = createState({ status: 'idle', stepIndex: -1, version: '1.0' })
    const stepIdMap = buildStepIdMap(flow)

    const result = handleVersionMismatch({
      storedState: state,
      storedVersion: { major: 1, minor: 0 },
      definition: flow,
      currentVersion: { major: 2, minor: 0 },
      stepIdMap,
      now,
    })

    expect(result.action).toBe('continued')
    expect(result.state.status).toBe('idle')
    expect(result.state.version).toBe('2.0')
  })
})
