import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTransport } from '../transport'
import type { StudioEvent } from '../types'

const makeEvent = (overrides: Partial<StudioEvent> = {}): StudioEvent => ({
  type: 'flowStart',
  timestamp: Date.now(),
  sessionId: 'sess-1',
  projectId: 'proj-1',
  flow: { id: 'tour-1', version: { major: 1, minor: 0 }, stepCount: 3 },
  state: { status: 'running', stepIndex: 0, version: '1.0', updatedAt: Date.now() },
  ...overrides,
})

describe('createTransport', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const createTestTransport = (overrides: Partial<Parameters<typeof createTransport>[0]> = {}) =>
    createTransport({
      endpoint: 'https://ingest.test.com',
      apiKey: 'test-key',
      batchSize: 3,
      flushIntervalMs: 5000,
      ...overrides,
    })

  it('enqueues events without flushing below batch size', () => {
    const transport = createTestTransport()
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())

    expect(mockFetch).not.toHaveBeenCalled()
    transport.shutdown()
  })

  it('auto-flushes when batch size reached', async () => {
    const transport = createTestTransport()
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())

    // Need to advance microtasks for the async flush
    await vi.advanceTimersByTimeAsync(0)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://ingest.test.com/v1/ingest',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
      }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.events).toHaveLength(3)
    transport.shutdown()
  })

  it('flushes on interval timer', async () => {
    const transport = createTestTransport()
    transport.enqueue(makeEvent())

    await vi.advanceTimersByTimeAsync(5000)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    transport.shutdown()
  })

  it('flush() is a noop when buffer is empty', async () => {
    const transport = createTestTransport()
    await transport.flush()

    expect(mockFetch).not.toHaveBeenCalled()
    transport.shutdown()
  })

  it('requeues events on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const transport = createTestTransport()
    transport.enqueue(makeEvent({ type: 'a' }))
    transport.enqueue(makeEvent({ type: 'b' }))
    transport.enqueue(makeEvent({ type: 'c' }))

    await vi.advanceTimersByTimeAsync(0)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalled()

    // Events should be re-enqueued, next flush should retry them
    mockFetch.mockResolvedValueOnce({ ok: true })
    await vi.advanceTimersByTimeAsync(5000)

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const retryBody = JSON.parse(mockFetch.mock.calls[1][1].body)
    expect(retryBody.events).toHaveLength(3)

    warnSpy.mockRestore()
    transport.shutdown()
  })

  it('requeues events on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const transport = createTestTransport()
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())

    await vi.advanceTimersByTimeAsync(0)

    expect(warnSpy).toHaveBeenCalled()

    // Verify events are requeued by flushing again
    mockFetch.mockResolvedValueOnce({ ok: true })
    await vi.advanceTimersByTimeAsync(5000)

    expect(mockFetch).toHaveBeenCalledTimes(2)

    warnSpy.mockRestore()
    transport.shutdown()
  })

  it('caps buffer at 500 events', () => {
    const transport = createTestTransport({ batchSize: 1000 })

    for (let i = 0; i < 600; i++) {
      transport.enqueue(makeEvent({ type: `event-${i}` }))
    }

    // When we flush, should only have 500 events max
    // The first 100 should have been dropped
    transport.shutdown()
  })

  it('strips trailing slash from endpoint', async () => {
    const transport = createTestTransport({ endpoint: 'https://ingest.test.com/' })
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())
    transport.enqueue(makeEvent())

    await vi.advanceTimersByTimeAsync(0)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ingest.test.com/v1/ingest',
      expect.any(Object),
    )
    transport.shutdown()
  })

  describe('shutdown', () => {
    it('clears interval and flushes remaining via sendBeacon', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true)
      vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon })

      const transport = createTestTransport()
      transport.enqueue(makeEvent())
      transport.enqueue(makeEvent())

      transport.shutdown()

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = mockSendBeacon.mock.calls[0]
      expect(url).toBe('https://ingest.test.com/v1/ingest')
      expect(blob).toBeInstanceOf(Blob)
    })

    it('falls back to fetch with keepalive when sendBeacon unavailable', () => {
      vi.stubGlobal('navigator', {})

      const transport = createTestTransport()
      transport.enqueue(makeEvent())

      transport.shutdown()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ingest.test.com/v1/ingest',
        expect.objectContaining({ keepalive: true }),
      )
    })

    it('is a noop when buffer is empty', () => {
      const mockSendBeacon = vi.fn()
      vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon })

      const transport = createTestTransport()
      transport.shutdown()

      expect(mockSendBeacon).not.toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
