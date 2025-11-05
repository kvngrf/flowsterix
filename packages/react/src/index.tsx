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
import type { PropsWithChildren, ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export interface TourProviderProps {
  flows: Array<FlowDefinition<ReactNode>>
  children: ReactNode
  storageAdapter?: StorageAdapter
  storageNamespace?: string
  persistOnChange?: boolean
  defaultDebug?: boolean
}

interface TourContextValue {
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
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined'

type ClientRectLike = {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

type RectInit = {
  top: number
  left: number
  width: number
  height: number
}

const createRect = ({
  top,
  left,
  width,
  height,
}: RectInit): ClientRectLike => ({
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

const toClientRect = (rect: DOMRect | DOMRectReadOnly): ClientRectLike =>
  createRect({
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  })

const getViewportRect = (): ClientRectLike => {
  if (!isBrowser) {
    return createRect({ top: 0, left: 0, width: 0, height: 0 })
  }
  return createRect({
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  })
}

const expandRect = (rect: ClientRectLike, padding: number): ClientRectLike => {
  if (!isBrowser) return rect
  const viewport = getViewportRect()
  const top = Math.max(0, rect.top - padding)
  const left = Math.max(0, rect.left - padding)
  const width = Math.min(viewport.width - left, rect.width + padding * 2)
  const height = Math.min(viewport.height - top, rect.height + padding * 2)
  return createRect({
    top,
    left,
    width: Math.max(0, width),
    height: Math.max(0, height),
  })
}

const isRectInViewport = (rect: ClientRectLike, margin = 0) => {
  if (!isBrowser) return true
  const viewport = getViewportRect()
  return (
    rect.top >= margin &&
    rect.left >= margin &&
    rect.bottom <= viewport.height - margin &&
    rect.right <= viewport.width - margin
  )
}

const resolveStepTarget = (
  target: Step<ReactNode>['target'],
): Element | null => {
  if (!isBrowser) return null
  if (target === 'screen') {
    return document.body
  }
  if (target.getNode) {
    try {
      const node = target.getNode()
      if (node) {
        return node
      }
    } catch {
      // ignore resolution errors from user land
    }
  }
  if (target.selector) {
    try {
      return document.querySelector(target.selector)
    } catch {
      return null
    }
  }
  return null
}

const getClientRect = (element: Element): ClientRectLike =>
  toClientRect(element.getBoundingClientRect())

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

  const teardownStore = useCallback(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    storeRef.current?.destroy()
    storeRef.current = null
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

export interface TourTargetInfo {
  element: Element | null
  rect: ClientRectLike | null
  isScreen: boolean
  status: 'idle' | 'resolving' | 'ready'
  stepId: string | null
  lastUpdated: number
}

const INITIAL_TARGET_INFO: TourTargetInfo = {
  element: null,
  rect: null,
  isScreen: false,
  status: 'idle',
  stepId: null,
  lastUpdated: 0,
}

export const useTourTarget = (): TourTargetInfo => {
  const { activeStep, state } = useTour()
  const [targetInfo, setTargetInfo] =
    useState<TourTargetInfo>(INITIAL_TARGET_INFO)
  const lastAutoScrollIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeStep || !state || state.status !== 'running') {
      setTargetInfo(INITIAL_TARGET_INFO)
      lastAutoScrollIdRef.current = null
      return
    }

    if (!isBrowser) {
      setTargetInfo({
        element: null,
        rect: null,
        isScreen: activeStep.target === 'screen',
        status: 'resolving',
        stepId: activeStep.id,
        lastUpdated: Date.now(),
      })
      return
    }

    const isScreen = activeStep.target === 'screen'
    let cancelled = false
    let pollId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    const cleanupFns: Array<() => void> = []
    let element: Element | null = null

    const commitInfo = (status: 'resolving' | 'ready') => {
      if (cancelled) return
      const rect = isScreen
        ? getViewportRect()
        : element
          ? getClientRect(element)
          : null
      setTargetInfo({
        element: element ?? null,
        rect,
        isScreen,
        status: rect && status === 'ready' ? 'ready' : 'resolving',
        stepId: activeStep.id,
        lastUpdated: Date.now(),
      })
    }

    const startObservers = () => {
      if (cancelled) return

      if (isScreen) {
        const onResize = () => commitInfo('ready')
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onResize, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onResize)
          window.removeEventListener('scroll', onResize, true)
        })
      } else if (element) {
        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(() => commitInfo('ready'))
          resizeObserver.observe(element)
        }
        const onReposition = () => commitInfo('ready')
        window.addEventListener('resize', onReposition)
        window.addEventListener('scroll', onReposition, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onReposition)
          window.removeEventListener('scroll', onReposition, true)
        })
      }

      commitInfo('ready')
    }

    const tryResolve = () => {
      element = resolveStepTarget(activeStep.target)
      if (isScreen || element) {
        startObservers()
        return true
      }
      commitInfo('resolving')
      return false
    }

    const resolved = tryResolve()
    if (!resolved) {
      const pollInterval = 200
      const timeout = activeStep.waitFor?.timeout ?? 8000
      const startedAt = Date.now()
      pollId = window.setInterval(() => {
        if (tryResolve()) {
          if (pollId) {
            window.clearInterval(pollId)
            pollId = null
          }
          return
        }
        if (timeout > 0 && Date.now() - startedAt >= timeout) {
          if (pollId) {
            window.clearInterval(pollId)
            pollId = null
          }
        }
      }, pollInterval)
    }

    return () => {
      cancelled = true
      if (pollId) window.clearInterval(pollId)
      resizeObserver?.disconnect()
      cleanupFns.forEach((dispose) => dispose())
    }
  }, [activeStep, state])

  useEffect(() => {
    if (!isBrowser) return
    if (!activeStep) return
    if (targetInfo.status !== 'ready') return
    if (targetInfo.isScreen) return
    if (!targetInfo.element || !targetInfo.rect) return
    if (lastAutoScrollIdRef.current === activeStep.id) return

    lastAutoScrollIdRef.current = activeStep.id

    if (!isRectInViewport(targetInfo.rect, 32)) {
      targetInfo.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [activeStep, targetInfo])

  return targetInfo
}

export interface TourRendererProps {
  flowId?: string
  children?: (payload: { step: Step<ReactNode>; state: FlowState }) => ReactNode
  fallback?: ReactNode
}

export const TourRenderer = ({
  flowId,
  children,
  fallback = null,
}: TourRendererProps) => {
  const { activeFlowId, activeStep, state } = useTour()
  const resolvedFlowId = flowId ?? activeFlowId

  if (!resolvedFlowId || !state || !activeStep || state.status !== 'running') {
    return <>{fallback}</>
  }

  if (!children) {
    return null
  }

  return <>{children({ step: activeStep, state })}</>
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

const portalHost = () => (isBrowser ? document.body : null)

export interface TourOverlayProps {
  target: TourTargetInfo
  padding?: number
  radius?: number
  color?: string
  opacity?: number
  zIndex?: number
}

export const TourOverlay = ({
  target,
  padding = 12,
  radius = 12,
  color = '#0f172a',
  opacity = 0.6,
  zIndex = 1000,
}: TourOverlayProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const viewport = getViewportRect()
  const highlightRect =
    target.isScreen || !target.rect
      ? viewport
      : expandRect(target.rect, padding)

  const topHeight = Math.max(0, highlightRect.top)
  const bottomHeight = Math.max(
    0,
    viewport.height - (highlightRect.top + highlightRect.height),
  )
  const leftWidth = Math.max(0, highlightRect.left)
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex,
    pointerEvents: 'none',
  }

  const layerStyle: React.CSSProperties = {
    position: 'fixed',
    backgroundColor: color,
    opacity,
    pointerEvents: 'auto',
    transition: 'transform 120ms ease, width 120ms ease, height 120ms ease',
  }

  const highlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: highlightRect.top,
    left: highlightRect.left,
    width: Math.max(0, highlightRect.width),
    height: Math.max(0, highlightRect.height),
    borderRadius: radius,
    boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.9)',
    pointerEvents: 'none',
    transition: 'transform 120ms ease, width 120ms ease, height 120ms ease',
  }

  return createPortal(
    <div style={overlayStyle} aria-hidden={target.status !== 'ready'}>
      <div
        style={{ ...layerStyle, top: 0, left: 0, right: 0, height: topHeight }}
      />
      <div
        style={{
          ...layerStyle,
          top: highlightRect.top,
          left: 0,
          width: leftWidth,
          height: Math.max(0, highlightRect.height),
        }}
      />
      <div
        style={{
          ...layerStyle,
          top: highlightRect.top,
          left: highlightRect.left + highlightRect.width,
          right: 0,
          height: Math.max(0, highlightRect.height),
        }}
      />
      <div
        style={{
          ...layerStyle,
          top: highlightRect.top + highlightRect.height,
          left: 0,
          right: 0,
          height: bottomHeight,
        }}
      />
      <div style={highlightStyle} />
    </div>,
    host,
  )
}

export interface TourPopoverProps {
  target: TourTargetInfo
  children: ReactNode
  offset?: number
  maxWidth?: number
  zIndex?: number
  className?: string
}

export const TourPopover = ({
  target,
  children,
  offset = 16,
  maxWidth = 360,
  zIndex = 1001,
  className,
}: TourPopoverProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const viewport = getViewportRect()
  const rect = target.rect ?? viewport
  const baseTop = target.isScreen
    ? viewport.height / 2
    : rect.top + rect.height + offset
  const top = target.isScreen
    ? viewport.height / 2
    : Math.min(viewport.height - 24, Math.max(24, baseTop))
  const left = target.isScreen ? viewport.width / 2 : rect.left + rect.width / 2

  const style: React.CSSProperties = {
    position: 'fixed',
    top,
    left,
    transform: target.isScreen ? 'translate(-50%, -50%)' : 'translate(-50%, 0)',
    zIndex,
    maxWidth,
    width: 'max-content',
    pointerEvents: 'auto',
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.35)',
    padding: '20px 24px',
    color: '#0f172a',
    transition: 'transform 120ms ease, top 120ms ease, left 120ms ease',
  }

  return createPortal(
    <div style={style} className={className} role="dialog" aria-live="polite">
      {children}
    </div>,
    host,
  )
}

export interface TourControlsProps {
  hideSkip?: boolean
  labels?: {
    back?: string
    next?: string
    finish?: string
    skip?: string
  }
}

export const TourControls = ({ hideSkip, labels }: TourControlsProps) => {
  const { back, next, cancel, complete, state, activeFlowId, flows } = useTour()
  const definition = activeFlowId ? flows.get(activeFlowId) : null
  const totalSteps = definition?.steps.length ?? 0
  const stepIndex = state?.stepIndex ?? -1
  const isFirst = stepIndex <= 0
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1

  const goNext = () => {
    if (isLast) {
      complete()
      return
    }
    next()
  }

  const actionStyle: React.CSSProperties = {
    appearance: 'none',
    border: 'none',
    background: '#0f172a',
    color: 'white',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 600,
  }

  const secondaryStyle: React.CSSProperties = {
    ...actionStyle,
    background: 'transparent',
    color: '#0f172a',
    border: '1px solid rgba(15, 23, 42, 0.2)',
  }

  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  }

  return (
    <div style={layoutStyle}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={back}
          disabled={isFirst}
          style={{
            ...secondaryStyle,
            opacity: isFirst ? 0.4 : 1,
            cursor: isFirst ? 'not-allowed' : 'pointer',
          }}
        >
          {labels?.back ?? 'Back'}
        </button>
        {!hideSkip && (
          <button
            type="button"
            onClick={() => cancel('skipped')}
            style={secondaryStyle}
          >
            {labels?.skip ?? 'Skip tour'}
          </button>
        )}
      </div>
      <button type="button" onClick={goNext} style={actionStyle}>
        {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
      </button>
    </div>
  )
}

interface TourKeyboardShortcutsProps {
  target: TourTargetInfo
}

const TourKeyboardShortcuts = ({ target }: TourKeyboardShortcutsProps) => {
  const { state, next, back, cancel, complete, activeFlowId, flows } = useTour()
  const definition = activeFlowId ? flows.get(activeFlowId) : null
  const totalSteps = definition?.steps.length ?? 0
  const isLast =
    state && totalSteps > 0 ? state.stepIndex >= totalSteps - 1 : false

  useEffect(() => {
    if (!isBrowser) return
    if (!state || state.status !== 'running') return

    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      if (event.key === 'Escape') {
        cancel('keyboard')
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowLeft') {
        back()
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowRight') {
        if (isLast) {
          complete()
        } else {
          next()
        }
        event.preventDefault()
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (target.status !== 'ready') return
        if (isLast) {
          complete()
        } else {
          next()
        }
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [back, cancel, complete, isLast, next, state, target.status])

  return null
}

export interface TourHUDRenderContext {
  step: Step<ReactNode>
  state: FlowState
  target: TourTargetInfo
}

export interface TourHUDProps {
  overlayPadding?: number
  overlayRadius?: number
  showControls?: boolean
  renderStep?: (context: TourHUDRenderContext) => ReactNode
}

export const TourHUD = ({
  overlayPadding,
  overlayRadius,
  showControls = true,
  renderStep,
}: TourHUDProps) => {
  const { state, activeStep } = useTour()
  const target = useTourTarget()

  if (!state || state.status !== 'running' || !activeStep) {
    return null
  }

  return (
    <>
      <TourKeyboardShortcuts target={target} />
      <TourOverlay
        target={target}
        padding={overlayPadding}
        radius={overlayRadius}
      />
      {renderStep ? (
        renderStep({ step: activeStep, state, target })
      ) : (
        <TourPopover target={target}>
          {activeStep.content}
          {showControls ? <TourControls /> : null}
        </TourPopover>
      )}
      <TourDebugPanel target={target} />
    </>
  )
}

interface TourDebugPanelProps {
  target: TourTargetInfo
}

const TourDebugPanel = ({ target }: TourDebugPanelProps) => {
  const { activeStep, state, debugEnabled, toggleDebug } = useTour()

  if (!isBrowser || !debugEnabled) {
    return null
  }

  const host = portalHost()
  if (!host) return null

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    minWidth: 260,
    maxWidth: 320,
    padding: '16px 18px',
    background: '#0f172a',
    color: 'white',
    fontSize: 12,
    fontFamily:
      'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    borderRadius: 12,
    boxShadow: '0 24px 50px -25px rgba(15, 23, 42, 0.65)',
    zIndex: 1200,
    pointerEvents: 'auto',
  }

  const headingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
  }

  const listStyle: React.CSSProperties = {
    display: 'grid',
    gap: 6,
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    whiteSpace: 'nowrap',
  }

  return createPortal(
    <div style={panelStyle}>
      <div style={headingStyle}>
        <span>Tour Debug</span>
        <button
          type="button"
          onClick={toggleDebug}
          style={{
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            color: 'rgba(248, 250, 252, 0.7)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Close
        </button>
      </div>
      <div style={listStyle}>
        <div style={itemStyle}>
          <span>Step</span>
          <span>{activeStep?.id ?? '—'}</span>
        </div>
        <div style={itemStyle}>
          <span>Status</span>
          <span>{state?.status ?? 'idle'}</span>
        </div>
        <div style={itemStyle}>
          <span>Target</span>
          <span>
            {target.isScreen
              ? 'screen'
              : target.element
                ? 'element'
                : 'pending'}
          </span>
        </div>
        <div style={itemStyle}>
          <span>Rect</span>
          <span>
            {target.rect
              ? `${Math.round(target.rect.width)}×${Math.round(target.rect.height)}`
              : '—'}
          </span>
        </div>
        <div style={itemStyle}>
          <span>Updated</span>
          <span>{new Date(target.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>,
    host,
  )
}
