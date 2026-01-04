import type {
  BackdropInteractionMode,
  EventBus,
  FlowAnalyticsHandlers,
  FlowDefinition,
  FlowEvents,
  FlowState,
  FlowStore,
  ResumeStrategy,
  StartFlowOptions,
  Step,
  StorageAdapter,
} from '@flowsterix/core'
import { createFlowStore, createLocalStorageAdapter } from '@flowsterix/core'
import type {
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
} from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { AnimationAdapter } from './motion/animationAdapter'
import {
  AnimationAdapterProvider,
  defaultAnimationAdapter,
  usePreferredAnimationAdapter,
} from './motion/animationAdapter'
import { isBrowser } from './utils/dom'

export interface DelayAdvanceInfo {
  flowId: string
  stepId: string
  totalMs: number
  startedAt: number
  endsAt: number
}

export interface TourProviderProps {
  flows: Array<FlowDefinition<ReactNode>>
  children: ReactNode
  storageAdapter?: StorageAdapter
  storageNamespace?: string
  persistOnChange?: boolean
  defaultDebug?: boolean
  animationAdapter?: AnimationAdapter
  reducedMotionAdapter?: AnimationAdapter
  autoDetectReducedMotion?: boolean
  analytics?: FlowAnalyticsHandlers<ReactNode>
  backdropInteraction?: BackdropInteractionMode
  lockBodyScroll?: boolean
}

export interface TourContextValue {
  flows: Map<string, FlowDefinition<ReactNode>>
  activeFlowId: string | null
  state: FlowState | null
  activeStep: Step<ReactNode> | null
  startFlow: (flowId: string, options?: StartFlowOptions) => FlowState
  next: () => FlowState
  back: () => FlowState
  goToStep: (step: number | string) => FlowState
  pause: () => FlowState
  resume: () => FlowState
  cancel: (reason?: string) => FlowState
  complete: () => FlowState
  events: EventBus<FlowEvents<ReactNode>> | null
  debugEnabled: boolean
  setDebugEnabled: (value: boolean) => void
  toggleDebug: () => void
  delayInfo: DelayAdvanceInfo | null
  /** @internal */
  setDelayInfo: Dispatch<SetStateAction<DelayAdvanceInfo | null>>
  backdropInteraction: BackdropInteractionMode
  lockBodyScroll: boolean
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

const useFlowMap = (flows: Array<FlowDefinition<ReactNode>>) => {
  return useMemo(() => {
    const map = new Map<string, FlowDefinition<ReactNode>>()
    for (const flow of flows) {
      map.set(flow.id, flow)
    }
    return map
  }, [flows])
}

export const TourProvider = ({
  flows,
  children,
  storageAdapter,
  storageNamespace,
  persistOnChange = true,
  defaultDebug = false,
  animationAdapter: animationAdapterProp = defaultAnimationAdapter,
  reducedMotionAdapter,
  autoDetectReducedMotion = true,
  analytics,
  backdropInteraction: backdropInteractionProp = 'passthrough',
  lockBodyScroll: lockBodyScrollProp = false,
}: PropsWithChildren<TourProviderProps>) => {
  const flowMap = useFlowMap(flows)
  const storeRef = useRef<FlowStore<ReactNode> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const stepHooksUnsubscribeRef = useRef<(() => void) | null>(null)
  const fallbackStorageRef = useRef<StorageAdapter | undefined>(undefined)
  const pendingResumeRef = useRef<Set<string>>(new Set())

  const [activeFlowId, setActiveFlowId] = useState<string | null>(null)
  const [state, setState] = useState<FlowState | null>(null)
  const [events, setEvents] = useState<EventBus<FlowEvents<ReactNode>> | null>(
    null,
  )
  const [debugEnabled, setDebugEnabled] = useState(defaultDebug)
  const [delayInfo, setDelayInfo] = useState<DelayAdvanceInfo | null>(null)

  const teardownStore = useCallback(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    stepHooksUnsubscribeRef.current?.()
    stepHooksUnsubscribeRef.current = null
    storeRef.current?.destroy()
    storeRef.current = null
    setDelayInfo(null)
    pendingResumeRef.current.clear()
  }, [])

  useEffect(() => {
    return () => {
      teardownStore()
      setState(null)
      setEvents(null)
      setActiveFlowId(null)
    }
  }, [teardownStore])

  useEffect(() => {
    if (!activeFlowId) return
    const definition = flowMap.get(activeFlowId)
    if (!definition) {
      teardownStore()
      setState(null)
      setEvents(null)
      setActiveFlowId(null)
    }
  }, [activeFlowId, flowMap, teardownStore])

  // Standalone function for invoking step hooks (not a hook itself)
  const invokeStepHookSync = (
    hook:
      | Step<ReactNode>['onEnter']
      | Step<ReactNode>['onResume']
      | Step<ReactNode>['onExit'],
    context: {
      flow: FlowDefinition<ReactNode>
      state: FlowState
      step: Step<ReactNode>
    },
    phase: 'enter' | 'resume' | 'exit',
  ): void => {
    if (!hook) return
    try {
      const result = hook(context)
      if (
        typeof result === 'object' &&
        result !== null &&
        typeof (result as PromiseLike<unknown>).then === 'function'
      ) {
        ;(result as Promise<void>).catch((error: unknown) => {
          console.warn(`[tour][step] ${phase} hook rejected`, error)
        })
      }
    } catch (error) {
      console.warn(`[tour][step] ${phase} hook failed`, error)
    }
  }

  const ensureStore = useCallback(
    (flowId: string): FlowStore<ReactNode> => {
      const existing = storeRef.current
      if (existing && existing.definition.id === flowId) {
        return existing
      }

      teardownStore()

      const definition = flowMap.get(flowId)
      if (!definition) {
        throw new Error(`Flow with id "${flowId}" is not registered.`)
      }

      if (!storageAdapter && !fallbackStorageRef.current && isBrowser) {
        fallbackStorageRef.current = createLocalStorageAdapter()
      }

      const resolvedStorageAdapter = storageAdapter
        ? storageAdapter
        : fallbackStorageRef.current

      const store = createFlowStore(definition, {
        storageAdapter: resolvedStorageAdapter,
        storageKey: storageNamespace
          ? `${storageNamespace}:${definition.id}`
          : undefined,
        persistOnChange,
        analytics,
      })

      // Subscribe to step lifecycle events immediately (before start() is called)
      const unsubscribeEnter = store.events.on('stepEnter', (payload) => {
        const step = payload.currentStep
        if (!step.onEnter) return
        invokeStepHookSync(
          step.onEnter,
          { flow: definition, state: payload.state, step },
          'enter',
        )
      })

      const unsubscribeExit = store.events.on('stepExit', (payload) => {
        const step = payload.previousStep
        if (!step.onExit) return
        invokeStepHookSync(
          step.onExit,
          { flow: definition, state: payload.state, step },
          'exit',
        )
      })

      stepHooksUnsubscribeRef.current = () => {
        unsubscribeEnter()
        unsubscribeExit()
      }

      unsubscribeRef.current = store.subscribe(setState)
      setEvents(store.events)
      storeRef.current = store
      return store
    },
    [
      analytics,
      flowMap,
      persistOnChange,
      storageAdapter,
      storageNamespace,
      teardownStore,
    ],
  )

  const getActiveStore = useCallback((): FlowStore<ReactNode> => {
    const store = storeRef.current
    if (!store) {
      throw new Error(
        'No active flow. Call startFlow before controlling progression.',
      )
    }
    return store
  }, [])

  const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as PromiseLike<unknown>).then === 'function'
    )
  }

  const invokeStepHook = useCallback(
    async (
      hook:
        | Step<ReactNode>['onEnter']
        | Step<ReactNode>['onResume']
        | Step<ReactNode>['onExit'],
      context: {
        flow: FlowDefinition<ReactNode>
        state: FlowState
        step: Step<ReactNode>
      },
      phase: 'enter' | 'resume' | 'exit',
    ): Promise<void> => {
      if (!hook) return
      try {
        const result = hook(context)
        if (isPromiseLike(result)) {
          await result
        }
      } catch (error) {
        console.warn(`[tour][step] ${phase} hook failed`, error)
      }
    },
    [],
  )

  const runResumeHooks = useCallback(
    async (
      definition: FlowDefinition<ReactNode>,
      flowState: FlowState,
      strategy: ResumeStrategy,
    ) => {
      if (flowState.status !== 'running') return
      if (strategy === 'current') {
        const index = flowState.stepIndex
        if (index < 0 || index >= definition.steps.length) return
        const step = definition.steps[index]
        if (!step.onResume) return
        await invokeStepHook(
          step.onResume,
          {
            flow: definition,
            state: flowState,
            step,
          },
          'resume',
        )
        return
      }

      const maxIndex = Math.min(
        flowState.stepIndex,
        definition.steps.length - 1,
      )
      if (maxIndex < 0) return
      for (let index = 0; index <= maxIndex; index += 1) {
        const step = definition.steps[index]
        if (!step.onResume) continue
        // Await each hook sequentially so DOM has time to update
        await invokeStepHook(
          step.onResume,
          {
            flow: definition,
            state: flowState,
            step,
          },
          'resume',
        )
      }
    },
    [invokeStepHook],
  )

  const resolveResumeStrategy = useCallback(
    (
      definition: FlowDefinition<ReactNode>,
      options?: StartFlowOptions,
    ): ResumeStrategy => {
      return options?.resumeStrategy ?? definition.resumeStrategy ?? 'chain'
    },
    [],
  )

  const startFlow = useCallback(
    (flowId: string, options?: StartFlowOptions) => {
      const store = ensureStore(flowId)
      const previousState = store.getState()
      setActiveFlowId(flowId)

      if (options?.resume) {
        pendingResumeRef.current.add(flowId)
      } else {
        pendingResumeRef.current.delete(flowId)
      }

      const nextState = store.start(options)

      if (!options?.resume) {
        return nextState
      }

      if (previousState.stepIndex >= 0 && nextState.status === 'running') {
        pendingResumeRef.current.delete(flowId)
        const resumeStrategy = resolveResumeStrategy(store.definition, options)
        const shouldRunResumeHooks =
          resumeStrategy === 'current'
            ? nextState.stepIndex >= 0
            : nextState.stepIndex > 0
        if (shouldRunResumeHooks) {
          void runResumeHooks(store.definition, nextState, resumeStrategy)
        }
      } else if (nextState.status !== 'idle' && nextState.stepIndex <= 0) {
        pendingResumeRef.current.delete(flowId)
      }

      return nextState
    },
    [ensureStore, resolveResumeStrategy, runResumeHooks],
  )

  const next = useCallback(() => getActiveStore().next(), [getActiveStore])
  const back = useCallback(() => getActiveStore().back(), [getActiveStore])
  const goToStep = useCallback(
    (step: number | string) => getActiveStore().goToStep(step),
    [getActiveStore],
  )
  const pause = useCallback(() => getActiveStore().pause(), [getActiveStore])
  const resume = useCallback(() => {
    const store = getActiveStore()
    const previousState = store.getState()

    if (previousState.status === 'paused') {
      pendingResumeRef.current.add(store.definition.id)
    }

    const nextState = store.resume()

    if (
      previousState.status === 'paused' &&
      nextState.status === 'running' &&
      nextState.stepIndex >= 0
    ) {
      pendingResumeRef.current.delete(store.definition.id)
      const resumeStrategy = resolveResumeStrategy(store.definition)
      const shouldRunResumeHooks =
        resumeStrategy === 'current' ? true : nextState.stepIndex > 0
      if (shouldRunResumeHooks) {
        void runResumeHooks(store.definition, nextState, resumeStrategy)
      }
    }

    return nextState
  }, [getActiveStore, resolveResumeStrategy, runResumeHooks])
  const cancel = useCallback(
    (reason?: string) => getActiveStore().cancel(reason),
    [getActiveStore],
  )
  const complete = useCallback(
    () => getActiveStore().complete(),
    [getActiveStore],
  )

  const toggleDebug = useCallback(() => {
    setDebugEnabled((previous) => !previous)
  }, [])

  const activeStep = useMemo(() => {
    if (!state || !storeRef.current) return null
    if (state.stepIndex < 0) return null
    return storeRef.current.definition.steps[state.stepIndex] ?? null
  }, [state])

  useEffect(() => {
    if (!activeFlowId) return
    if (!pendingResumeRef.current.has(activeFlowId)) return
    if (!state || state.status !== 'running') return

    const definition = flowMap.get(activeFlowId)
    if (!definition) return
    const resumeStrategy = resolveResumeStrategy(definition)
    const shouldRunResumeHooks =
      resumeStrategy === 'current' ? state.stepIndex >= 0 : state.stepIndex > 0
    if (!shouldRunResumeHooks) {
      pendingResumeRef.current.delete(activeFlowId)
      return
    }

    pendingResumeRef.current.delete(activeFlowId)
    void runResumeHooks(definition, state, resumeStrategy)
  }, [activeFlowId, flowMap, resolveResumeStrategy, runResumeHooks, state])

  const contextValue: TourContextValue = useMemo(
    () => ({
      flows: flowMap,
      activeFlowId,
      state,
      activeStep,
      startFlow,
      next,
      back,
      goToStep,
      pause,
      resume,
      cancel,
      complete,
      events,
      debugEnabled,
      setDebugEnabled,
      toggleDebug,
      delayInfo,
      setDelayInfo,
      backdropInteraction: backdropInteractionProp,
      lockBodyScroll: lockBodyScrollProp,
    }),
    [
      activeFlowId,
      activeStep,
      back,
      cancel,
      complete,
      debugEnabled,
      events,
      flowMap,
      goToStep,
      next,
      pause,
      resume,
      delayInfo,
      setDelayInfo,
      setDebugEnabled,
      startFlow,
      state,
      toggleDebug,
      backdropInteractionProp,
      lockBodyScrollProp,
    ],
  )

  const resolvedAnimationAdapter = usePreferredAnimationAdapter({
    defaultAdapter: animationAdapterProp,
    reducedMotionAdapter,
    enabled: autoDetectReducedMotion,
  })

  return (
    <AnimationAdapterProvider adapter={resolvedAnimationAdapter}>
      <TourContext.Provider value={contextValue}>
        {children}
      </TourContext.Provider>
    </AnimationAdapterProvider>
  )
}

export const useTour = (): TourContextValue => {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

export const useTourEvents = <
  TEventKey extends Extract<keyof FlowEvents<ReactNode>, string>,
>(
  event: TEventKey,
  handler: (payload: FlowEvents<ReactNode>[TEventKey]) => void,
) => {
  const { events } = useTour()

  useEffect(() => {
    if (!events) return
    return events.on(event, handler as (payload: unknown) => void)
  }, [event, events, handler])
}
