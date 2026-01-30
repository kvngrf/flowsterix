import { describe, expect, it, vi } from 'vitest'
import { createFlowStore } from '../state'
import type { StorageAdapter } from '../storage'
import type { FlowAnalyticsHandlers, FlowDefinition } from '../types'

const demoFlow: FlowDefinition<string> = {
  id: 'demo',
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      content: 'Welcome',
    },
    {
      id: 'cta',
      target: 'screen',
      content: 'CTA copy',
    },
  ],
}

describe('flow analytics + errors', () => {
  it('invokes analytics handlers for lifecycle + step events', () => {
    const onFlowStart = vi.fn()
    const onStepEnter = vi.fn()
    const onStepExit = vi.fn()
    const onStepComplete = vi.fn()
    const onFlowComplete = vi.fn()
    const analytics: FlowAnalyticsHandlers<string> = {
      onFlowStart,
      onStepEnter,
      onStepExit,
      onStepComplete,
      onFlowComplete,
    }

    const store = createFlowStore(demoFlow, {
      analytics,
      persistOnChange: false,
    })

    store.start()
    store.next()
    store.complete()

    expect(onFlowStart).toHaveBeenCalledTimes(1)
    expect(onStepEnter).toHaveBeenCalledTimes(2)
    expect(onStepEnter).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        currentStepIndex: 0,
        reason: 'start',
      }),
    )
    expect(onStepEnter).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        currentStepIndex: 1,
        reason: 'advance',
      }),
    )
    expect(onStepExit).toHaveBeenCalled()
    expect(onStepComplete).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        previousStepIndex: 0,
        reason: 'advance',
      }),
    )
    expect(onStepComplete).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        previousStepIndex: 1,
        reason: 'flowComplete',
      }),
    )
    expect(onFlowComplete).toHaveBeenCalledTimes(1)
  })

  it('emits flowError when persistence fails', async () => {
    const onFlowError = vi.fn()
    const analytics: FlowAnalyticsHandlers<string> = {
      onFlowError,
    }

    const storageAdapter: StorageAdapter = {
      get: () => null,
      set: () => Promise.reject(new Error('persist failed')),
      remove: () => undefined,
    }

    const store = createFlowStore(demoFlow, {
      analytics,
      storageAdapter,
    })

    store.start()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onFlowError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'storage.persist_failed',
      }),
    )
  })
})

describe('advanceStep', () => {
  it('advances when on matching step', () => {
    const store = createFlowStore(demoFlow, { persistOnChange: false })
    store.start()

    expect(store.getState().stepIndex).toBe(0)
    store.advanceStep('welcome')
    expect(store.getState().stepIndex).toBe(1)
  })

  it('does not advance when on different step', () => {
    const store = createFlowStore(demoFlow, { persistOnChange: false })
    store.start()

    expect(store.getState().stepIndex).toBe(0)
    store.advanceStep('cta')
    expect(store.getState().stepIndex).toBe(0)
  })

  it('does not advance when stepId does not exist', () => {
    const store = createFlowStore(demoFlow, { persistOnChange: false })
    store.start()

    expect(store.getState().stepIndex).toBe(0)
    store.advanceStep('nonexistent')
    expect(store.getState().stepIndex).toBe(0)
  })

  it('does not advance when flow is not running', () => {
    const store = createFlowStore(demoFlow, { persistOnChange: false })

    expect(store.getState().status).toBe('idle')
    store.advanceStep('welcome')
    expect(store.getState().status).toBe('idle')
  })

  it('completes flow when on last step', () => {
    const store = createFlowStore(demoFlow, { persistOnChange: false })
    store.start()
    store.next()

    expect(store.getState().stepIndex).toBe(1)
    store.advanceStep('cta')
    expect(store.getState().status).toBe('completed')
  })
})
