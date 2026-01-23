import type { FlowDefinition, FlowState, Step } from '@flowsterix/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createWaitForPredicateController } from '../waitForPredicate'

const demoFlow: FlowDefinition<string> = {
  id: 'demo-flow',
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: 'demo-step',
      target: 'screen',
      content: 'Welcome',
    },
  ],
}

const demoStep: Step<string> = demoFlow.steps[0]

const demoState: FlowState = {
  status: 'running',
  stepIndex: 0,
  version: '1.0',
  updatedAt: 0,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createWaitForPredicateController', () => {
  it('polls predicate until it resolves to true', () => {
    vi.useFakeTimers()
    let ready = false
    const onChange = vi.fn()

    const controller = createWaitForPredicateController({
      waitFor: {
        predicate: () => ready,
        pollMs: 50,
      },
      context: {
        flow: demoFlow,
        state: demoState,
        step: demoStep,
      },
      onChange,
    })

    controller.start()
    expect(controller.isSatisfied()).toBe(false)

    ready = true
    vi.advanceTimersByTime(60)

    expect(onChange).toHaveBeenCalledWith(true)
    expect(controller.isSatisfied()).toBe(true)

    controller.stop()
  })

  it('allows subscribe-only handlers to control readiness manually', () => {
    const onChange = vi.fn()
    let cleanupCalled = false
    let notify: (next?: boolean) => void = () => {}

    const controller = createWaitForPredicateController({
      waitFor: {
        subscribe: (ctx) => {
          notify = ctx.notify
          return () => {
            cleanupCalled = true
          }
        },
      },
      context: {
        flow: demoFlow,
        state: demoState,
        step: demoStep,
      },
      onChange,
    })

    controller.start()
    expect(controller.isSatisfied()).toBe(false)

    notify(true)

    expect(onChange).toHaveBeenCalledWith(true)
    expect(controller.isSatisfied()).toBe(true)

    controller.stop()
    expect(cleanupCalled).toBe(true)
  })

  it('uses subscribe notifications to re-run predicate checks', () => {
    const onChange = vi.fn()
    let notify: (next?: boolean) => void = () => {}
    let ready = false

    const controller = createWaitForPredicateController({
      waitFor: {
        predicate: () => ready,
        subscribe: (ctx) => {
          notify = ctx.notify
        },
      },
      context: {
        flow: demoFlow,
        state: demoState,
        step: demoStep,
      },
      onChange,
    })

    controller.start()
    expect(controller.isSatisfied()).toBe(false)

    ready = true
    notify()

    expect(onChange).toHaveBeenCalledWith(true)
    expect(controller.isSatisfied()).toBe(true)

    controller.stop()
  })
})
