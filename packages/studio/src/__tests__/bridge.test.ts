import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StorageAdapter } from '@flowsterix/core'
import { createStudioBridge } from '../bridge'

describe('createStudioBridge', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-session-id' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const defaultParams = {
    projectId: 'proj-1',
    apiKey: 'key-1',
    endpoint: 'https://ingest.test.com',
    flushIntervalMs: 60000, // long interval to avoid auto-flush in tests
  }

  it('returns StudioBridge shape', () => {
    const bridge = createStudioBridge(defaultParams)

    expect(bridge.analytics).toBeDefined()
    expect(bridge.storage).toBeTypeOf('function')
    expect(bridge.identify).toBeTypeOf('function')
    expect(bridge.flush).toBeTypeOf('function')
    expect(bridge.shutdown).toBeTypeOf('function')

    bridge.shutdown()
  })

  it('creates all 12 analytics handlers', () => {
    const bridge = createStudioBridge(defaultParams)

    const expectedHandlers = [
      'onFlowStart',
      'onFlowResume',
      'onFlowPause',
      'onFlowCancel',
      'onFlowComplete',
      'onStepChange',
      'onStateChange',
      'onStepEnter',
      'onStepExit',
      'onStepComplete',
      'onFlowError',
      'onVersionMismatch',
    ]

    for (const handler of expectedHandlers) {
      expect(bridge.analytics).toHaveProperty(handler)
      expect((bridge.analytics as Record<string, unknown>)[handler]).toBeTypeOf('function')
    }

    bridge.shutdown()
  })

  it('analytics handlers enqueue events to transport', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const bridge = createStudioBridge({ ...defaultParams, batchSize: 1 })

    const flow = {
      id: 'tour-1',
      version: { major: 1, minor: 0 },
      steps: [],
    }
    const state = {
      status: 'running' as const,
      stepIndex: 0,
      version: '1.0',
      updatedAt: Date.now(),
    }

    bridge.analytics.onFlowStart!({ flow, state })

    // Wait for async flush
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockFetch).toHaveBeenCalled()
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.events[0].type).toBe('flowStart')
    expect(body.events[0].projectId).toBe('proj-1')
    expect(body.events[0].sessionId).toBe('mock-session-id')

    bridge.shutdown()
  })

  it('storage() wraps inner adapter', () => {
    const bridge = createStudioBridge(defaultParams)
    const inner: StorageAdapter = {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
      remove: vi.fn(),
    }

    const wrapped = bridge.storage({ inner })

    expect(wrapped.get).toBeTypeOf('function')
    expect(wrapped.set).toBeTypeOf('function')
    expect(wrapped.remove).toBeTypeOf('function')

    wrapped.get('key')
    expect(inner.get).toHaveBeenCalledWith('key')

    bridge.shutdown()
  })

  it('identify() updates user context and enqueues identify event', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const bridge = createStudioBridge({ ...defaultParams, batchSize: 1 })

    bridge.identify({ user: { id: 'user-1', traits: { plan: 'pro' } } })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockFetch).toHaveBeenCalled()
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.events[0].type).toBe('identify')
    expect(body.events[0].user).toEqual({ id: 'user-1', traits: { plan: 'pro' } })

    bridge.shutdown()
  })

  it('flush() triggers transport flush', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const bridge = createStudioBridge(defaultParams)

    const flow = {
      id: 'tour-1',
      version: { major: 1, minor: 0 },
      steps: [],
    }
    const state = {
      status: 'running' as const,
      stepIndex: 0,
      version: '1.0',
      updatedAt: Date.now(),
    }

    bridge.analytics.onFlowStart!({ flow, state })
    await bridge.flush()

    expect(mockFetch).toHaveBeenCalled()

    bridge.shutdown()
  })

  it('shutdown() cleans up', () => {
    const mockSendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon })

    const bridge = createStudioBridge(defaultParams)

    // Enqueue something so shutdown has work to do
    bridge.identify({ user: { id: 'user-1' } })

    expect(() => bridge.shutdown()).not.toThrow()
    expect(mockSendBeacon).toHaveBeenCalled()
  })
})
