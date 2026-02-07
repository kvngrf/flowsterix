import type { StorageAdapter } from '@flowsterix/core'
import type { Transport } from './types'

interface CreateStudioStorageAdapterParams {
  inner: StorageAdapter
  transport: Transport
  sessionId: string
  projectId: string
}

export const createStudioStorageAdapter = (
  params: CreateStudioStorageAdapterParams,
): StorageAdapter => {
  const { inner, transport, sessionId, projectId } = params

  const get: StorageAdapter['get'] = (key) => inner.get(key)

  const set: StorageAdapter['set'] = (key, snapshot) => {
    const result = inner.set(key, snapshot)
    try {
      transport.enqueue({
        type: 'storage.set',
        timestamp: Date.now(),
        sessionId,
        projectId,
        flow: { id: key, version: { major: 0, minor: 0 }, stepCount: 0 },
        state: {
          status: 'idle',
          stepIndex: -1,
          version: '0.0',
          updatedAt: Date.now(),
        },
      })
    } catch {
      // fire-and-forget: never block the inner adapter
    }
    return result
  }

  const remove: StorageAdapter['remove'] = (key) => {
    const result = inner.remove(key)
    try {
      transport.enqueue({
        type: 'storage.remove',
        timestamp: Date.now(),
        sessionId,
        projectId,
        flow: { id: key, version: { major: 0, minor: 0 }, stepCount: 0 },
        state: {
          status: 'idle',
          stepIndex: -1,
          version: '0.0',
          updatedAt: Date.now(),
        },
      })
    } catch {
      // fire-and-forget: never block the inner adapter
    }
    return result
  }

  const adapter: StorageAdapter = { get, set, remove }

  if (inner.subscribe) {
    adapter.subscribe = inner.subscribe
  }

  return adapter
}
