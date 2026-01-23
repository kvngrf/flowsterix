import type { EventBus } from './events'
import { createEventBus } from './events'
import type { StorageAdapter, StorageSnapshot } from './storage'
import { resolveMaybePromise } from './storage'
import type {
  FlowAnalyticsHandlers,
  FlowCancelReason,
  FlowDefinition,
  FlowErrorCode,
  FlowEvents,
  FlowState,
  FlowStore,
  FlowVersion,
  StartFlowOptions,
  Step,
  StepCompleteReason,
  StepDirection,
  StepEnterReason,
  StepExitReason,
  VersionMismatchInfo,
} from './types'
import {
  buildStepIdMap,
  handleVersionMismatch,
  parseVersion,
  serializeVersion,
} from './version'

export interface FlowStoreOptions<TContent = unknown> {
  storageAdapter?: StorageAdapter
  storageKey?: string
  eventBus?: EventBus<FlowEvents<TContent>>
  now?: () => number
  persistOnChange?: boolean
  analytics?: FlowAnalyticsHandlers<TContent>
  /** Callback when a version mismatch is detected and resolved */
  onVersionMismatch?: (info: VersionMismatchInfo) => void
}

interface CommitOptions {
  persist?: boolean
  emitLifecycle?: boolean
  preserveTimestamp?: boolean
  cancelReason?: FlowCancelReason
}

const DEFAULT_STORAGE_PREFIX = 'tour'

const clampIndex = (value: number, max: number) => {
  if (value < 0) return 0
  if (value > max) return max
  return value
}

const cloneState = (state: FlowState): FlowState => ({ ...state })

const getStepDirection = (
  previousIndex: number,
  currentIndex: number,
): StepDirection => {
  if (currentIndex > previousIndex) return 'forward'
  if (currentIndex < previousIndex) return 'backward'
  return 'none'
}

const getStepEnterReason = (
  previousState: FlowState,
  currentState: FlowState,
  direction: StepDirection,
): StepEnterReason => {
  if (previousState.status === 'idle' && currentState.status === 'running') {
    return 'start'
  }
  if (previousState.status === 'paused' && currentState.status === 'running') {
    return 'resume'
  }
  if (direction === 'forward') return 'advance'
  if (direction === 'backward') return 'back'
  return 'jump'
}

const getStepExitReason = (
  currentState: FlowState,
  direction: StepDirection,
): StepExitReason => {
  if (currentState.status === 'paused') return 'pause'
  if (currentState.status === 'cancelled') return 'cancel'
  if (currentState.status === 'completed') return 'complete'
  if (direction === 'forward') return 'advance'
  if (direction === 'backward') return 'back'
  return 'unknown'
}

const getStepCompleteReason = (currentState: FlowState): StepCompleteReason => {
  if (currentState.status === 'completed') {
    return 'flowComplete'
  }
  return 'advance'
}

const createInitialState = <TContent>(
  definition: FlowDefinition<TContent>,
  now: () => number,
): FlowState => ({
  status: 'idle',
  stepIndex: -1,
  version: serializeVersion(definition.version),
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
  // Accept both string (new format) and number (legacy) for backward compatibility
  const hasValidVersion =
    typeof flowValue.version === 'string' || typeof flowValue.version === 'number'
  return (
    typeof flowValue.status === 'string' &&
    typeof flowValue.stepIndex === 'number' &&
    hasValidVersion
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
    analytics,
    onVersionMismatch,
  } = flowOptions

  const currentVersion: FlowVersion = definition.version
  const stepIdMap = buildStepIdMap(definition)

  let state = createInitialState(definition, now)
  const subscribers = new Set<(next: FlowState) => void>()
  let destroyed = false
  let unsubscribeStorage: (() => void) | null = null
  let isHydrating = false
  let hasHydrated = !storageAdapter
  let pendingStartOptions: StartFlowOptions | undefined

  const callAnalytics = <
    TEvent extends Extract<keyof FlowEvents<TContent>, string>,
  >(
    event: TEvent,
    payload: FlowEvents<TContent>[TEvent],
  ) => {
    if (!analytics) return
    const eventName = String(event)
    const handlerKey = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(
      1,
    )}` as keyof FlowAnalyticsHandlers<TContent>
    const handler = analytics[handlerKey] as
      | ((value: FlowEvents<TContent>[TEvent]) => void)
      | undefined
    handler?.(payload)
  }

  const emitEvent = <
    TEvent extends Extract<keyof FlowEvents<TContent>, string>,
  >(
    event: TEvent,
    payload: FlowEvents<TContent>[TEvent],
  ) => {
    eventBus.emit(event, payload)
    callAnalytics(event, payload)
  }

  const emitFlowError = (
    code: FlowErrorCode,
    error: unknown,
    meta?: Record<string, unknown>,
  ) => {
    emitEvent('flowError', {
      flow: definition,
      state,
      code,
      error,
      meta,
    })
  }

  const scheduleMicrotask = (fn: () => void) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(fn)
      return
    }
    Promise.resolve()
      .then(fn)
      .catch((error) => {
        console.warn('[tour][flow] async scheduling failed', error)
        emitFlowError('async.schedule_failed', error, {
          operation: 'queueMicrotaskFallback',
        })
      })
  }

  const runPendingStart = () => {
    if (!pendingStartOptions) return
    const pending = pendingStartOptions
    pendingStartOptions = undefined
    scheduleMicrotask(() => {
      start(pending)
    })
  }

  const notifySubscribers = () => {
    for (const listener of Array.from(subscribers)) {
      listener(state)
    }
  }

  const persistState = (nextState: FlowState) => {
    if (!storageAdapter || !persistOnChange) return
    if (isHydrating) return
    const result = storageAdapter.set(storageKey, snapshotFromState(nextState))
    if (result instanceof Promise) {
      result.catch((error) => {
        console.warn('[tour][storage] Failed to persist flow state', error)
        emitFlowError('storage.persist_failed', error, { key: storageKey })
      })
    }
  }

  const emitLifecycleEvents = (
    previousState: FlowState,
    currentState: FlowState,
    lifecycleOptions?: { cancelReason?: FlowCancelReason },
  ) => {
    if (previousState.status !== currentState.status) {
      if (currentState.status === 'running') {
        const payload = { flow: definition, state: currentState }
        if (previousState.status === 'paused') {
          emitEvent('flowResume', payload)
        } else {
          emitEvent('flowStart', payload)
        }
      }
      if (currentState.status === 'paused') {
        emitEvent('flowPause', { flow: definition, state: currentState })
      }
      if (currentState.status === 'cancelled') {
        emitEvent('flowCancel', {
          flow: definition,
          state: currentState,
          reason: lifecycleOptions?.cancelReason,
        })
      }
      if (currentState.status === 'completed') {
        emitEvent('flowComplete', { flow: definition, state: currentState })
      }
    }

    const previousStep = getStep(definition, previousState.stepIndex)
    const currentStep = getStep(definition, currentState.stepIndex)
    const direction = getStepDirection(
      previousState.stepIndex,
      currentState.stepIndex,
    )

    const shouldEmitStepExit =
      previousStep !== null &&
      (direction !== 'none' || currentState.status !== 'running')

    if (shouldEmitStepExit) {
      const exitedStep = previousStep
      emitEvent('stepExit', {
        flow: definition,
        state: currentState,
        currentStep,
        currentStepIndex: currentState.stepIndex,
        previousStep: exitedStep,
        previousStepIndex: previousState.stepIndex,
        direction,
        reason: getStepExitReason(currentState, direction),
      })
    }

    const shouldEmitStepComplete =
      previousStep !== null &&
      (direction === 'forward' ||
        (currentState.status === 'completed' &&
          previousState.status !== 'completed'))

    if (shouldEmitStepComplete) {
      const completedStep = previousStep
      emitEvent('stepComplete', {
        flow: definition,
        state: currentState,
        currentStep,
        currentStepIndex: currentState.stepIndex,
        previousStep: completedStep,
        previousStepIndex: previousState.stepIndex,
        direction,
        reason: getStepCompleteReason(currentState),
      })
    }

    const shouldEmitStepEnter =
      currentState.status === 'running' &&
      currentStep !== null &&
      (direction !== 'none' || previousState.status !== 'running')

    if (shouldEmitStepEnter) {
      const enteredStep = currentStep
      emitEvent('stepEnter', {
        flow: definition,
        state: currentState,
        currentStep: enteredStep,
        currentStepIndex: currentState.stepIndex,
        previousStep,
        previousStepIndex: previousState.stepIndex,
        direction,
        reason: getStepEnterReason(previousState, currentState, direction),
      })
    }

    if (
      previousState.stepIndex !== currentState.stepIndex ||
      previousState.status !== currentState.status
    ) {
      emitEvent('stepChange', {
        flow: definition,
        state: currentState,
        step: currentStep,
        previousStep,
      })
    }

    emitEvent('stateChange', { flow: definition, state: currentState })
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
      const error = new Error('Flow store has been destroyed')
      emitFlowError('flow.store_destroyed', error, { operation: 'commit' })
      throw error
    }

    const previousState = state
    const timestamp = preserveTimestamp ? nextState.updatedAt : now()
    // Include stepId for version migration matching
    const currentStepId =
      nextState.stepIndex >= 0
        ? definition.steps[nextState.stepIndex]?.id
        : undefined
    const hydratedNext: FlowState = {
      ...nextState,
      version: serializeVersion(currentVersion),
      stepId: currentStepId,
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

      // Parse stored version (handles both legacy number and new string format)
      const storedVersion = parseVersion(snapshot.version)
      const storedState: FlowState = {
        ...snapshot.value,
        // Normalize version to string format if it was legacy number
        version:
          typeof snapshot.value.version === 'number'
            ? serializeVersion({ major: snapshot.value.version, minor: 0 })
            : snapshot.value.version,
      }

      // Handle version mismatch
      const { state: resolvedState, action } = handleVersionMismatch({
        storedState,
        storedVersion,
        definition,
        currentVersion,
        stepIdMap,
        now,
      })

      // Emit version mismatch event if version changed
      if (action !== 'continued' || serializeVersion(storedVersion) !== serializeVersion(currentVersion)) {
        const mismatchInfo: VersionMismatchInfo = {
          flowId: definition.id,
          oldVersion: storedVersion,
          newVersion: currentVersion,
          action,
          resolvedStepId:
            resolvedState.stepIndex >= 0
              ? definition.steps[resolvedState.stepIndex]?.id
              : undefined,
          resolvedStepIndex:
            resolvedState.stepIndex >= 0 ? resolvedState.stepIndex : undefined,
        }

        emitEvent('versionMismatch', { ...mismatchInfo, flow: definition })
        onVersionMismatch?.(mismatchInfo)

        // If we reset, just update state without persisting (will persist on next action)
        if (action === 'reset') {
          state = resolvedState
          notifySubscribers()
          return
        }
      }

      // Commit the resolved state
      commit(resolvedState, {
        persist: action !== 'continued', // Persist if we migrated
        preserveTimestamp: action === 'continued',
      })
    } catch (error) {
      console.warn('[tour][storage] failed to hydrate flow state', error)
      emitFlowError('storage.hydrate_failed', error, { key: storageKey })
    } finally {
      isHydrating = false
      hasHydrated = true
      runPendingStart()
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
    if (!hasHydrated) {
      pendingStartOptions = startConfig ?? {}
      if (!isHydrating) {
        void hydrateFromStorage()
      }
      return state
    }
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
        const error = new Error(
          `Step with id "${fromStepId}" not found in flow ${definition.id}`,
        )
        emitFlowError('flow.step_not_found', error, {
          stepId: fromStepId,
          operation: 'start',
        })
        throw error
      }
      targetIndex = index
    } else if (state.stepIndex >= 0) {
      const canResumeFromStoredStep =
        state.status === 'running' ||
        state.status === 'paused' ||
        (state.status === 'cancelled' && state.cancelReason === 'keyboard')

      if (canResumeFromStoredStep) {
        targetIndex = clampIndex(state.stepIndex, definition.steps.length - 1)
      }
    }

    return commit({
      status: 'running',
      stepIndex: targetIndex,
      version: state.version,
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
      version: state.version,
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
      version: state.version,
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
        const error = new Error(
          `Step with id "${step}" not found in flow ${definition.id}`,
        )
        emitFlowError('flow.step_not_found', error, {
          stepId: step,
          operation: 'goToStep',
        })
        throw error
      }
      targetIndex = index
    }
    return commit({
      status: 'running',
      stepIndex: targetIndex,
      version: state.version,
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
      version: state.version,
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
      version: state.version,
      updatedAt: state.updatedAt,
    })
  }

  const cancel = (reason?: FlowCancelReason) => {
    if (state.status === 'cancelled') {
      return state
    }
    return commit(
      {
        status: 'cancelled',
        stepIndex: state.stepIndex,
        version: state.version,
        updatedAt: state.updatedAt,
        cancelReason: reason,
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
      version: state.version,
      updatedAt: state.updatedAt,
    })
  }

  const subscribe: FlowStore<TContent>['subscribe'] = (listener) => {
    if (destroyed) {
      const error = new Error('Cannot subscribe to a destroyed flow store')
      emitFlowError('flow.store_destroyed', error, { operation: 'subscribe' })
      throw error
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
