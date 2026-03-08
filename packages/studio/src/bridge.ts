import type {
  FlowAnalyticsHandlers,
  FlowEvents,
  FlowIntegration,
  StorageAdapter,
} from '@flowsterix/core'
import { serializeEvent } from './serializer'
import { createStudioStorageAdapter } from './storage'
import { createTransport } from './transport'
import type {
  StudioBridge,
  StudioBridgeOptions,
  StudioIntegrationOptions,
  UserContext,
} from './types'

const DEFAULT_ENDPOINT = 'https://ingest.flowsterix.studio'
const DEFAULT_BATCH_SIZE = 20
const DEFAULT_FLUSH_INTERVAL_MS = 5000

const EVENT_KEYS: Array<Extract<keyof FlowEvents, string>> = [
  'flowStart',
  'flowResume',
  'flowPause',
  'flowCancel',
  'flowComplete',
  'stepChange',
  'stateChange',
  'stepEnter',
  'stepExit',
  'stepComplete',
  'flowError',
  'versionMismatch',
]

export const createStudioBridge = (
  params: StudioBridgeOptions,
): StudioBridge => {
  const {
    apiKey,
    endpoint = DEFAULT_ENDPOINT,
    debug = false,
    batchSize = DEFAULT_BATCH_SIZE,
    flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
  } = params

  let user: UserContext | undefined = params.user
  const sessionId = crypto.randomUUID()

  const transport = createTransport({
    endpoint,
    apiKey,
    batchSize,
    flushIntervalMs,
  })

  // Flush on page hide (tab close, navigate away)
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      transport.shutdown()
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  // Build analytics handlers — one per event key
  const analytics = {} as FlowAnalyticsHandlers<unknown>
  for (const eventKey of EVENT_KEYS) {
    const handlerName =
      `on${eventKey.charAt(0).toUpperCase()}${eventKey.slice(1)}` as keyof FlowAnalyticsHandlers<unknown>
    ;(analytics as Record<string, unknown>)[handlerName] = (
      payload: FlowEvents[typeof eventKey],
    ) => {
      const studioEvent = serializeEvent({
        event: eventKey,
        payload,
        sessionId,
        user,
        debug,
      })
      transport.enqueue(studioEvent)
    }
  }

  const storage = (storageParams: { inner: StorageAdapter }): StorageAdapter =>
    createStudioStorageAdapter({
      inner: storageParams.inner,
      transport,
      sessionId,
    })

  const identify = (identifyParams: { user: UserContext }) => {
    user = identifyParams.user
    transport.enqueue({
      type: 'identify',
      timestamp: Date.now(),
      sessionId,
      user,
      flow: { id: '', version: { major: 0, minor: 0 }, stepCount: 0 },
      state: {
        status: 'idle',
        stepIndex: -1,
        version: '0.0',
        updatedAt: Date.now(),
      },
    })
  }

  const flush = () => transport.flush()

  const shutdown = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    transport.shutdown()
  }

  return { analytics, storage, identify, flush, shutdown }
}

let cachedIntegration: { options: StudioIntegrationOptions; value: FlowIntegration } | null = null

export const studioIntegration = (
  params: StudioIntegrationOptions,
): FlowIntegration => {
  // Return cached instance if options match (singleton per config)
  if (
    cachedIntegration &&
    cachedIntegration.options.apiKey === params.apiKey &&
    cachedIntegration.options.endpoint === params.endpoint
  ) {
    return cachedIntegration.value
  }

  const bridge = createStudioBridge(params)

  const integration: FlowIntegration = {
    name: 'studio',
    analytics: bridge.analytics,
    wrapStorage: bridge.storage,
  }

  cachedIntegration = { options: params, value: integration }
  return integration
}
