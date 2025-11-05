import type { EventBus } from './events'
import { createEventBus } from './events'
import type { StorageAdapter, StorageSnapshot } from './storage'
import { resolveMaybePromise } from './storage'
import type {
  FlowDefinition,
  FlowEvents,
  FlowState,
  FlowStore,
  StartFlowOptions,
  Step,
} from './types'

export interface FlowStoreOptions<TContent = unknown> {
  storageAdapter?: StorageAdapter
  storageKey?: string
  eventBus?: EventBus<FlowEvents<TContent>>
  now?: () => number
  persistOnChange?: boolean
}

interface CommitOptions {
  persist?: boolean
  emitLifecycle?: boolean
  preserveTimestamp?: boolean
  cancelReason?: string
}

const DEFAULT_STORAGE_PREFIX = 'tour'

const clampIndex = (value: number, max: number) => {
  if (value < 0) return 0
  if (value > max) return max
  return value
}

const cloneState = (state: FlowState): FlowState => ({ ...state })

const createInitialState = <TContent>(
  definition: FlowDefinition<TContent>,
  now: () => number,
): FlowState => ({
  status: 'idle',
  stepIndex: -1,
  version: definition.version,
  updatedAt: now(),
})

const getStep = <TContent>(
  definition: FlowDefinition<TContent>,
  index: number,
): Step<TContent> | null => {
  if (index < 0) return null
  return definition.steps[index] ?? null
}

const snapshotFromState = (state: FlowState): StorageSnapshot<FlowState> => ({
  version: state.version,
  value: cloneState(state),
  updatedAt: state.updatedAt,
})

const isFlowStateSnapshot = (
  snapshot: StorageSnapshot | null,
): snapshot is StorageSnapshot<FlowState> => {
  if (!snapshot) return false
  const { value } = snapshot
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const flowValue = value as Partial<FlowState>
  return (
    typeof flowValue.status === 'string' &&
    typeof flowValue.stepIndex === 'number' &&
    typeof flowValue.version === 'number'
  )
}

export const createFlowStore = <TContent>(
  definition: FlowDefinition<TContent>,
  flowOptions: FlowStoreOptions<TContent> = {},
): FlowStore<TContent> => {
  const {
    storageAdapter,
    storageKey = `${DEFAULT_STORAGE_PREFIX}:${definition.id}`,
    eventBus = createEventBus<FlowEvents<TContent>>(),
    now = () => Date.now(),
    persistOnChange = true,
  } = flowOptions

  let state = createInitialState(definition, now)
  const subscribers = new Set<(next: FlowState) => void>()
  let destroyed = false
  let unsubscribeStorage: (() => void) | null = null
  let isHydrating = false

  const notifySubscribers = () => {
    for (const listener of Array.from(subscribers)) {
      listener(state)
    }
  }

  const persistState = (nextState: FlowState) => {
    if (!storageAdapter || !persistOnChange) return
    const result = storageAdapter.set(storageKey, snapshotFromState(nextState))
    if (result instanceof Promise) {
      result.catch((error) => {
        console.warn('[tour][storage] Failed to persist flow state', error)
      })
    }
  }

  const emitLifecycleEvents = (
    previousState: FlowState,
    currentState: FlowState,
    lifecycleOptions?: { cancelReason?: string },
  ) => {
    if (previousState.status !== currentState.status) {
      if (currentState.status === 'running') {
        const payload = { flow: definition, state: currentState }
        if (previousState.status === 'paused') {
          eventBus.emit('flowResume', payload)
        } else {
          eventBus.emit('flowStart', payload)
        }
      }
      if (currentState.status === 'paused') {
        eventBus.emit('flowPause', { flow: definition, state: currentState })
      }
      if (currentState.status === 'cancelled') {
        eventBus.emit('flowCancel', {
          flow: definition,
          state: currentState,
          reason: lifecycleOptions?.cancelReason,
        })
      }
      if (currentState.status === 'completed') {
        eventBus.emit('flowComplete', { flow: definition, state: currentState })
      }
    }

    if (
      previousState.stepIndex !== currentState.stepIndex ||
      previousState.status !== currentState.status
    ) {
      eventBus.emit('stepChange', {
        flow: definition,
        state: currentState,
        step: getStep(definition, currentState.stepIndex),
        previousStep: getStep(definition, previousState.stepIndex),
      })
    }

    eventBus.emit('stateChange', { flow: definition, state: currentState })
  }

  const commit = (
    nextState: FlowState,
    commitConfig: CommitOptions = {},
  ): FlowState => {
    const {
      persist: shouldPersist = true,
      emitLifecycle = true,
      preserveTimestamp = false,
      cancelReason,
    } = commitConfig

    if (destroyed) {
      throw new Error('Flow store has been destroyed')
    }

    const previousState = state
    const timestamp = preserveTimestamp ? nextState.updatedAt : now()
    const hydratedNext: FlowState = {
      ...nextState,
      version: definition.version,
      updatedAt: timestamp,
    }

    const changed =
      previousState.status !== hydratedNext.status ||
      previousState.stepIndex !== hydratedNext.stepIndex ||
      previousState.updatedAt !== hydratedNext.updatedAt

    if (!changed) {
      return state
    }

    state = hydratedNext

    if (shouldPersist) {
      persistState(state)
    }

    if (emitLifecycle) {
      emitLifecycleEvents(previousState, state, { cancelReason })
    }

    notifySubscribers()
    return state
  }

  const hydrateFromStorage = async () => {
    if (!storageAdapter || isHydrating) return
    isHydrating = true
    try {
      const snapshot = (await resolveMaybePromise(
        storageAdapter.get(storageKey),
      )) as StorageSnapshot<FlowState> | null
      if (!snapshot || !isFlowStateSnapshot(snapshot)) return
      if (snapshot.version !== definition.version) {
        const removal = storageAdapter.remove(storageKey)
        if (removal instanceof Promise) {
          removal.catch((error) => {
            console.warn(
              '[tour][storage] failed to remove outdated snapshot',
              error,
            )
          })
        }
        return
      }
      commit(snapshot.value, { persist: false, preserveTimestamp: true })
    } catch (error) {
      console.warn('[tour][storage] failed to hydrate flow state', error)
    } finally {
      isHydrating = false
    }
  }

  if (storageAdapter) {
    void hydrateFromStorage()
    if (storageAdapter.subscribe) {
      unsubscribeStorage = storageAdapter.subscribe(() => {
        void hydrateFromStorage()
      })
    }
  }

  const start = (startConfig?: StartFlowOptions) => {
    const { fromStepId, fromStepIndex, resume } = startConfig ?? {}

    if (resume && (state.status === 'paused' || state.status === 'running')) {
      return resumeFlow()
    }

    let targetIndex = 0
    if (typeof fromStepIndex === 'number') {
      targetIndex = clampIndex(fromStepIndex, definition.steps.length - 1)
    } else if (fromStepId) {
      const index = definition.steps.findIndex((step) => step.id === fromStepId)
      if (index === -1) {
        throw new Error(
          `Step with id "${fromStepId}" not found in flow ${definition.id}`,
        )
      }
      targetIndex = index
    } else if (state.stepIndex >= 0) {
      targetIndex = clampIndex(state.stepIndex, definition.steps.length - 1)
    }

    return commit({
      status: 'running',
      stepIndex: targetIndex,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const next = () => {
    if (state.status !== 'running') {
      return state
    }
    if (state.stepIndex >= definition.steps.length - 1) {
      return complete()
    }
    return commit({
      status: 'running',
      stepIndex: state.stepIndex + 1,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const back = () => {
    if (state.status !== 'running') {
      return state
    }
    if (state.stepIndex <= 0) {
      return state
    }
    return commit({
      status: 'running',
      stepIndex: state.stepIndex - 1,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const goToStep = (step: number | string) => {
    if (state.status !== 'running') {
      return state
    }
    let targetIndex: number
    if (typeof step === 'number') {
      targetIndex = clampIndex(step, definition.steps.length - 1)
    } else {
      const index = definition.steps.findIndex((item) => item.id === step)
      if (index === -1) {
        throw new Error(
          `Step with id "${step}" not found in flow ${definition.id}`,
        )
      }
      targetIndex = index
    }
    return commit({
      status: 'running',
      stepIndex: targetIndex,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const pause = () => {
    if (state.status !== 'running') {
      return state
    }
    return commit({
      status: 'paused',
      stepIndex: state.stepIndex,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const resumeFlow = () => {
    if (state.status !== 'paused') {
      return state
    }
    const index = clampIndex(
      state.stepIndex < 0 ? 0 : state.stepIndex,
      definition.steps.length - 1,
    )
    return commit({
      status: 'running',
      stepIndex: index,
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const cancel = (reason?: string) => {
    if (state.status === 'cancelled') {
      return state
    }
    return commit(
      {
        status: 'cancelled',
        stepIndex: state.stepIndex,
        version: definition.version,
        updatedAt: state.updatedAt,
      },
      { cancelReason: reason },
    )
  }

  const complete = () => {
    if (state.status === 'completed') {
      return state
    }
    return commit({
      status: 'completed',
      stepIndex: clampIndex(state.stepIndex, definition.steps.length - 1),
      version: definition.version,
      updatedAt: state.updatedAt,
    })
  }

  const subscribe: FlowStore<TContent>['subscribe'] = (listener) => {
    if (destroyed) {
      throw new Error('Cannot subscribe to a destroyed flow store')
    }
    subscribers.add(listener)
    listener(state)
    return () => {
      subscribers.delete(listener)
    }
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    subscribers.clear()
    eventBus.clear()
    if (unsubscribeStorage) {
      unsubscribeStorage()
    }
  }

  return {
    definition,
    events: eventBus,
    getState: () => state,
    start,
    next,
    back,
    goToStep,
    pause,
    resume: resumeFlow,
    cancel,
    complete,
    subscribe,
    destroy,
  }
}
