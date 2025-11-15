import { describe, expect, it, vi } from 'vitest'
import { createFlowStore } from '../state'
import type { FlowAnalyticsHandlers, FlowDefinition } from '../types'
import type { StorageAdapter } from '../storage'

const demoFlow: FlowDefinition<string> = {
  id: 'demo',
  version: 1,
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
