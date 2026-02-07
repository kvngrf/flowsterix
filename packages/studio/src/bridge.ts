import type {
  FlowAnalyticsHandlers,
  FlowEvents,
  StorageAdapter,
} from '@flowsterix/core'
import { serializeEvent } from './serializer'
import { createStudioStorageAdapter } from './storage'
import { createTransport } from './transport'
import type { StudioBridge, StudioBridgeOptions, UserContext } from './types'

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
    projectId,
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
        projectId,
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
      projectId,
    })

  const identify = (identifyParams: { user: UserContext }) => {
    user = identifyParams.user
    transport.enqueue({
      type: 'identify',
      timestamp: Date.now(),
      sessionId,
      projectId,
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
