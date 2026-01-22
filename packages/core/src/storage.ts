export interface StorageSnapshot<TValue = unknown> {
  version: number
  value: TValue
  updatedAt: number
}

export interface StorageAdapter {
  get: (key: string) => StorageSnapshot | null | Promise<StorageSnapshot | null>
  set: (key: string, value: StorageSnapshot) => void | Promise<void>
  remove: (key: string) => void | Promise<void>
  subscribe?: (listener: () => void) => () => void
}

export const resolveMaybePromise = async <TValue>(
  value: TValue | Promise<TValue>,
): Promise<TValue> => await value

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, StorageSnapshot>()
  private readonly listeners = new Set<() => void>()

  get: StorageAdapter['get'] = (key) => {
    return this.store.get(key) ?? null
  }

  set: StorageAdapter['set'] = (key, snapshot) => {
    this.store.set(key, snapshot)
    this.emit()
  }

  remove: StorageAdapter['remove'] = (key) => {
    this.store.delete(key)
    this.emit()
  }

  subscribe: NonNullable<StorageAdapter['subscribe']> = (listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    for (const listener of Array.from(this.listeners)) {
      listener()
    }
  }
}

const safeGlobal = typeof globalThis !== 'undefined' ? globalThis : undefined

const isStorageSnapshotShape = (value: unknown): value is StorageSnapshot => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const snapshot = value as Partial<StorageSnapshot>
  return (
    typeof snapshot.version === 'number' &&
    typeof snapshot.updatedAt === 'number' &&
    'value' in snapshot
  )
}

export const createLocalStorageAdapter = (
  storage: Storage | null = getLocalStorage(),
): StorageAdapter => {
  const listeners = new Set<() => void>()

  const get: StorageAdapter['get'] = (key) => {
    if (!storage) return null
    const raw = storage.getItem(key)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!isStorageSnapshotShape(parsed)) {
        return null
      }
      return parsed
    } catch (error) {
      console.warn(
        '[tour][storage] Failed to parse snapshot for key',
        key,
        error,
      )
      return null
    }
  }

  const set: StorageAdapter['set'] = (key, snapshot) => {
    if (!storage) return
    storage.setItem(key, JSON.stringify(snapshot))
    emit()
  }

  const remove: StorageAdapter['remove'] = (key) => {
    if (!storage) return
    storage.removeItem(key)
    emit()
  }

  const subscribe: NonNullable<StorageAdapter['subscribe']> = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const emit = () => {
    for (const listener of Array.from(listeners)) {
      listener()
    }
  }

  return { get, set, remove, subscribe }
}

function getLocalStorage(): Storage | null {
  try {
    if (!safeGlobal) return null
    if ('localStorage' in safeGlobal) {
      return safeGlobal.localStorage
    }
  } catch (error) {
    console.warn('[tour][storage] localStorage unavailable', error)
  }
  return null
}

export interface ApiStorageAdapterOptions {
  /** Base URL for the storage API (e.g., '/api/tour-state' or 'https://api.example.com/tours') */
  baseUrl: string
  /** Function to get headers for each request (e.g., for auth tokens) */
  getHeaders?: () => Promise<HeadersInit> | HeadersInit
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch
}

/**
 * Creates a storage adapter that persists tour state via HTTP API.
 *
 * Expects the API to implement:
 * - GET /{key} → returns StorageSnapshot JSON or 404
 * - PUT /{key} → accepts StorageSnapshot JSON body
 * - DELETE /{key} → removes the snapshot
 *
 * @example
 * ```ts
 * const storageAdapter = createApiStorageAdapter({
 *   baseUrl: '/api/tour-state',
 *   getHeaders: () => ({ Authorization: `Bearer ${getToken()}` }),
 * })
 *
 * <TourProvider flows={flows} storageAdapter={storageAdapter}>
 * ```
 */
export function createApiStorageAdapter(
  options: ApiStorageAdapterOptions,
): StorageAdapter {
  const {
    baseUrl,
    getHeaders = () => ({}),
    fetch: fetchFn = globalThis.fetch,
  } = options

  const buildUrl = (key: string) =>
    `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(key)}`

  const get: StorageAdapter['get'] = async (key) => {
    try {
      const headers = await Promise.resolve(getHeaders())
      const res = await fetchFn(buildUrl(key), { headers })

      if (res.status === 404) return null
      if (!res.ok) {
        console.warn('[tour][storage] API get failed', res.status, res.statusText)
        return null
      }

      const data = (await res.json()) as unknown
      if (!isStorageSnapshotShape(data)) {
        console.warn('[tour][storage] Invalid snapshot shape from API')
        return null
      }
      return data
    } catch (error) {
      console.warn('[tour][storage] API get error', error)
      return null
    }
  }

  const set: StorageAdapter['set'] = async (key, snapshot) => {
    try {
      const headers = await Promise.resolve(getHeaders())
      const res = await fetchFn(buildUrl(key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(snapshot),
      })

      if (!res.ok) {
        console.warn('[tour][storage] API set failed', res.status, res.statusText)
      }
    } catch (error) {
      console.warn('[tour][storage] API set error', error)
    }
  }

  const remove: StorageAdapter['remove'] = async (key) => {
    try {
      const headers = await Promise.resolve(getHeaders())
      const res = await fetchFn(buildUrl(key), {
        method: 'DELETE',
        headers,
      })

      if (!res.ok && res.status !== 404) {
        console.warn('[tour][storage] API remove failed', res.status, res.statusText)
      }
    } catch (error) {
      console.warn('[tour][storage] API remove error', error)
    }
  }

  return { get, set, remove }
}
