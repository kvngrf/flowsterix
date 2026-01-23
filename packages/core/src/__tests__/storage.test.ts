import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MemoryStorageAdapter,
  createLocalStorageAdapter,
  createApiStorageAdapter,
  type StorageSnapshot,
} from '../storage'

const validSnapshot: StorageSnapshot = {
  version: '1.0',
  value: { stepIndex: 2, status: 'running' },
  updatedAt: 1700000000000,
}

describe('MemoryStorageAdapter', () => {
  it('get() returns null for missing key', () => {
    const adapter = new MemoryStorageAdapter()
    expect(adapter.get('missing')).toBeNull()
  })

  it('set() then get() returns stored value', () => {
    const adapter = new MemoryStorageAdapter()
    adapter.set('flow-1', validSnapshot)
    expect(adapter.get('flow-1')).toEqual(validSnapshot)
  })

  it('remove() deletes stored value', () => {
    const adapter = new MemoryStorageAdapter()
    adapter.set('flow-1', validSnapshot)
    adapter.remove('flow-1')
    expect(adapter.get('flow-1')).toBeNull()
  })

  it('subscribe() notifies listener on set', () => {
    const adapter = new MemoryStorageAdapter()
    const listener = vi.fn()

    adapter.subscribe(listener)
    adapter.set('flow-1', validSnapshot)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('subscribe() notifies listener on remove', () => {
    const adapter = new MemoryStorageAdapter()
    const listener = vi.fn()

    adapter.set('flow-1', validSnapshot)
    adapter.subscribe(listener)
    adapter.remove('flow-1')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe stops notifications', () => {
    const adapter = new MemoryStorageAdapter()
    const listener = vi.fn()

    const unsub = adapter.subscribe(listener)
    unsub()
    adapter.set('flow-1', validSnapshot)

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('createLocalStorageAdapter', () => {
  const createMockStorage = (): Storage => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  })

  it('get() returns null when storage is null', () => {
    const adapter = createLocalStorageAdapter(null)
    expect(adapter.get('key')).toBeNull()
  })

  it('get() returns null when key not found', () => {
    const storage = createMockStorage()
    vi.mocked(storage.getItem).mockReturnValue(null)

    const adapter = createLocalStorageAdapter(storage)
    expect(adapter.get('missing')).toBeNull()
  })

  it('get() parses valid JSON snapshot', () => {
    const storage = createMockStorage()
    vi.mocked(storage.getItem).mockReturnValue(JSON.stringify(validSnapshot))

    const adapter = createLocalStorageAdapter(storage)
    expect(adapter.get('flow-1')).toEqual(validSnapshot)
  })

  it('get() returns null for invalid JSON', () => {
    const storage = createMockStorage()
    vi.mocked(storage.getItem).mockReturnValue('not valid json')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const adapter = createLocalStorageAdapter(storage)
    expect(adapter.get('flow-1')).toBeNull()
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('get() returns null for invalid snapshot shape', () => {
    const storage = createMockStorage()
    vi.mocked(storage.getItem).mockReturnValue(JSON.stringify({ invalid: true }))

    const adapter = createLocalStorageAdapter(storage)
    expect(adapter.get('flow-1')).toBeNull()
  })

  it('get() accepts legacy number version format', () => {
    const storage = createMockStorage()
    const legacySnapshot = { version: 1, value: {}, updatedAt: 1700000000000 }
    vi.mocked(storage.getItem).mockReturnValue(JSON.stringify(legacySnapshot))

    const adapter = createLocalStorageAdapter(storage)
    expect(adapter.get('flow-1')).toEqual(legacySnapshot)
  })

  it('set() calls setItem with JSON', () => {
    const storage = createMockStorage()
    const adapter = createLocalStorageAdapter(storage)

    adapter.set('flow-1', validSnapshot)

    expect(storage.setItem).toHaveBeenCalledWith('flow-1', JSON.stringify(validSnapshot))
  })

  it('set() does nothing when storage is null', () => {
    const adapter = createLocalStorageAdapter(null)
    expect(() => adapter.set('flow-1', validSnapshot)).not.toThrow()
  })

  it('remove() calls removeItem', () => {
    const storage = createMockStorage()
    const adapter = createLocalStorageAdapter(storage)

    adapter.remove('flow-1')

    expect(storage.removeItem).toHaveBeenCalledWith('flow-1')
  })

  it('remove() does nothing when storage is null', () => {
    const adapter = createLocalStorageAdapter(null)
    expect(() => adapter.remove('flow-1')).not.toThrow()
  })

  it('subscribe() notifies on set', () => {
    const storage = createMockStorage()
    const adapter = createLocalStorageAdapter(storage)
    const listener = vi.fn()

    adapter.subscribe!(listener)
    adapter.set('flow-1', validSnapshot)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('subscribe() unsubscribe stops notifications', () => {
    const storage = createMockStorage()
    const adapter = createLocalStorageAdapter(storage)
    const listener = vi.fn()

    const unsub = adapter.subscribe!(listener)
    unsub()
    adapter.set('flow-1', validSnapshot)

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('createApiStorageAdapter', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
  })

  const createAdapter = (options: Partial<Parameters<typeof createApiStorageAdapter>[0]> = {}) =>
    createApiStorageAdapter({
      baseUrl: 'https://api.test.com/state',
      fetch: mockFetch,
      ...options,
    })

  describe('get()', () => {
    it('calls fetch with correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter()
      await adapter.get('flow-1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/state/flow-1',
        expect.objectContaining({ headers: {} }),
      )
    })

    it('encodes special characters in key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter()
      await adapter.get('flow/with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/state/flow%2Fwith%20spaces',
        expect.any(Object),
      )
    })

    it('strips trailing slash from baseUrl', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter({ baseUrl: 'https://api.test.com/state/' })
      await adapter.get('flow-1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/state/flow-1',
        expect.any(Object),
      )
    })

    it('returns snapshot on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter()
      const result = await adapter.get('flow-1')

      expect(result).toEqual(validSnapshot)
    })

    it('returns null on 404', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 })

      const adapter = createAdapter()
      const result = await adapter.get('flow-1')

      expect(result).toBeNull()
    })

    it('returns null on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      const result = await adapter.get('flow-1')

      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      const result = await adapter.get('flow-1')

      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('returns null for invalid snapshot shape', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: true }),
      })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      const result = await adapter.get('flow-1')

      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('includes custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter({
        getHeaders: () => ({ Authorization: 'Bearer token123' }),
      })
      await adapter.get('flow-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token123' },
        }),
      )
    })

    it('supports async getHeaders', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validSnapshot),
      })

      const adapter = createAdapter({
        getHeaders: async () => ({ Authorization: 'Bearer async-token' }),
      })
      await adapter.get('flow-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer async-token' },
        }),
      )
    })
  })

  describe('set()', () => {
    it('calls fetch with PUT method and JSON body', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      const adapter = createAdapter()
      await adapter.set('flow-1', validSnapshot)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/state/flow-1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validSnapshot),
        }),
      )
    })

    it('merges custom headers with Content-Type', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      const adapter = createAdapter({
        getHeaders: () => ({ Authorization: 'Bearer token' }),
      })
      await adapter.set('flow-1', validSnapshot)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
        }),
      )
    })

    it('warns on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      await adapter.set('flow-1', validSnapshot)

      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('warns on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      await adapter.set('flow-1', validSnapshot)

      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('remove()', () => {
    it('calls fetch with DELETE method', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      const adapter = createAdapter()
      await adapter.remove('flow-1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/state/flow-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {},
        }),
      )
    })

    it('does not warn on 404', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      await adapter.remove('flow-1')

      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('warns on other non-ok responses', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const adapter = createAdapter()
      await adapter.remove('flow-1')

      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('no subscribe', () => {
    it('does not have subscribe method', () => {
      const adapter = createAdapter()
      expect(adapter.subscribe).toBeUndefined()
    })
  })
})
