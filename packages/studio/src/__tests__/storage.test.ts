import { describe, expect, it, vi } from 'vitest'
import type { StorageAdapter, StorageSnapshot } from '@flowsterix/core'
import { createStudioStorageAdapter } from '../storage'
import type { Transport } from '../types'

const validSnapshot: StorageSnapshot = {
  version: '1.0',
  value: { stepIndex: 2, status: 'running' },
  updatedAt: 1700000000000,
}

const createMockInner = (): StorageAdapter => ({
  get: vi.fn().mockReturnValue(validSnapshot),
  set: vi.fn(),
  remove: vi.fn(),
})

const createMockTransport = (): Transport => ({
  enqueue: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn(),
})

const baseParams = {
  sessionId: 'sess-1',
  projectId: 'proj-1',
}

describe('createStudioStorageAdapter', () => {
  describe('get()', () => {
    it('delegates to inner adapter', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      const result = adapter.get('flow-1')

      expect(inner.get).toHaveBeenCalledWith('flow-1')
      expect(result).toEqual(validSnapshot)
    })

    it('does not enqueue any transport event', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      adapter.get('flow-1')

      expect(transport.enqueue).not.toHaveBeenCalled()
    })
  })

  describe('set()', () => {
    it('delegates to inner adapter', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      adapter.set('flow-1', validSnapshot)

      expect(inner.set).toHaveBeenCalledWith('flow-1', validSnapshot)
    })

    it('enqueues storage.set event to transport', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      adapter.set('flow-1', validSnapshot)

      expect(transport.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'storage.set' }),
      )
    })

    it('does not throw if transport.enqueue throws', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      vi.mocked(transport.enqueue).mockImplementation(() => {
        throw new Error('transport failure')
      })
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      expect(() => adapter.set('flow-1', validSnapshot)).not.toThrow()
      expect(inner.set).toHaveBeenCalled()
    })
  })

  describe('remove()', () => {
    it('delegates to inner adapter', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      adapter.remove('flow-1')

      expect(inner.remove).toHaveBeenCalledWith('flow-1')
    })

    it('enqueues storage.remove event to transport', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      adapter.remove('flow-1')

      expect(transport.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'storage.remove' }),
      )
    })

    it('does not throw if transport.enqueue throws', () => {
      const inner = createMockInner()
      const transport = createMockTransport()
      vi.mocked(transport.enqueue).mockImplementation(() => {
        throw new Error('transport failure')
      })
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      expect(() => adapter.remove('flow-1')).not.toThrow()
      expect(inner.remove).toHaveBeenCalled()
    })
  })

  describe('subscribe', () => {
    it('delegates subscribe when inner has it', () => {
      const mockUnsub = vi.fn()
      const inner = createMockInner()
      inner.subscribe = vi.fn().mockReturnValue(mockUnsub)
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      const listener = vi.fn()
      const unsub = adapter.subscribe!(listener)

      expect(inner.subscribe).toHaveBeenCalledWith(listener)
      expect(unsub).toBe(mockUnsub)
    })

    it('does not have subscribe when inner lacks it', () => {
      const inner = createMockInner()
      delete (inner as Partial<StorageAdapter>).subscribe
      const transport = createMockTransport()
      const adapter = createStudioStorageAdapter({ inner, transport, ...baseParams })

      expect(adapter.subscribe).toBeUndefined()
    })
  })
})
