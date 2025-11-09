import type {
  EventBus,
  FlowDefinition,
  FlowEvents,
  FlowState,
  FlowStore,
  StartFlowOptions,
  Step,
  StorageAdapter,
} from '@tour/core'
import { createFlowStore } from '@tour/core'
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
}: PropsWithChildren<TourProviderProps>) => {
  const flowMap = useFlowMap(flows)
  const storeRef = useRef<FlowStore<ReactNode> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

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
    storeRef.current?.destroy()
    storeRef.current = null
    setDelayInfo(null)
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

      const store = createFlowStore(definition, {
        storageAdapter,
        storageKey: storageNamespace
          ? `${storageNamespace}:${definition.id}`
          : undefined,
        persistOnChange,
      })

      unsubscribeRef.current = store.subscribe(setState)
      setEvents(store.events)
      storeRef.current = store
      return store
    },
    [flowMap, persistOnChange, storageAdapter, storageNamespace, teardownStore],
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

  const startFlow = useCallback(
    (flowId: string, options?: StartFlowOptions) => {
      const store = ensureStore(flowId)
      setActiveFlowId(flowId)
      return store.start(options)
    },
    [ensureStore],
  )

  const next = useCallback(() => getActiveStore().next(), [getActiveStore])
  const back = useCallback(() => getActiveStore().back(), [getActiveStore])
  const goToStep = useCallback(
    (step: number | string) => getActiveStore().goToStep(step),
    [getActiveStore],
  )
  const pause = useCallback(() => getActiveStore().pause(), [getActiveStore])
  const resume = useCallback(() => getActiveStore().resume(), [getActiveStore])
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
    ],
  )

  return (
    <TourContext.Provider value={contextValue}>{children}</TourContext.Provider>
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
