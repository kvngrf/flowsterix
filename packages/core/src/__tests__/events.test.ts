import { describe, it, expect, vi } from 'vitest'
import { createEventBus } from '../events'

type TestEvents = {
  foo: { value: number }
  bar: string
}

describe('createEventBus', () => {
  it('registers handler and emits payload', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    bus.on('foo', handler)
    bus.emit('foo', { value: 42 })

    expect(handler).toHaveBeenCalledWith({ value: 42 })
  })

  it('on() returns unsubscribe function', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    const unsub = bus.on('foo', handler)
    unsub()
    bus.emit('foo', { value: 1 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('calls multiple handlers for same event', () => {
    const bus = createEventBus<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('foo', handler1)
    bus.on('foo', handler2)
    bus.emit('foo', { value: 5 })

    expect(handler1).toHaveBeenCalledWith({ value: 5 })
    expect(handler2).toHaveBeenCalledWith({ value: 5 })
  })

  it('off() removes handler', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    bus.on('foo', handler)
    bus.off('foo', handler)
    bus.emit('foo', { value: 1 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('off() on non-existent event does not throw', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    expect(() => bus.off('foo', handler)).not.toThrow()
  })

  it('once() fires handler only once', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    bus.once('foo', handler)
    bus.emit('foo', { value: 1 })
    bus.emit('foo', { value: 2 })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ value: 1 })
  })

  it('once() can be unsubscribed before emit', () => {
    const bus = createEventBus<TestEvents>()
    const handler = vi.fn()

    const unsub = bus.once('foo', handler)
    unsub()
    bus.emit('foo', { value: 1 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('emit() with no listeners does not throw', () => {
    const bus = createEventBus<TestEvents>()

    expect(() => bus.emit('foo', { value: 1 })).not.toThrow()
  })

  it('clear() removes all listeners', () => {
    const bus = createEventBus<TestEvents>()
    const fooHandler = vi.fn()
    const barHandler = vi.fn()

    bus.on('foo', fooHandler)
    bus.on('bar', barHandler)
    bus.clear()
    bus.emit('foo', { value: 1 })
    bus.emit('bar', 'test')

    expect(fooHandler).not.toHaveBeenCalled()
    expect(barHandler).not.toHaveBeenCalled()
  })
})
