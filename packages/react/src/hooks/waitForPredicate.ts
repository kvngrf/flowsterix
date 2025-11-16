import type { StepHookContext, StepWaitFor } from '@tour/core'

export interface WaitForPredicateControllerOptions<TContent = unknown> {
  waitFor?: StepWaitFor<TContent>
  context: StepHookContext<TContent> | null
  onChange?: (satisfied: boolean) => void
  warn?: (...args: Array<unknown>) => void
}

export interface WaitForPredicateController {
  start: () => void
  stop: () => void
  evaluate: () => void
  isSatisfied: () => boolean
}

const defaultWarn = (...args: Array<unknown>) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(...args)
  }
}

const isPromiseLike = <T>(value: unknown): value is PromiseLike<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}

export const createWaitForPredicateController = <TContent = unknown>({
  waitFor,
  context,
  onChange,
  warn = defaultWarn,
}: WaitForPredicateControllerOptions<TContent>): WaitForPredicateController => {
  const hasPredicate = Boolean(waitFor?.predicate && context)
  const hasSubscription = Boolean(waitFor?.subscribe && context)
  let satisfied = !hasPredicate && !hasSubscription
  let destroyed = false
  let pollId: number | null = null
  let subscriptionCleanup: (() => void) | null = null
  let lastCheckId = 0

  const update = (nextValue: boolean) => {
    const normalized = Boolean(nextValue)
    if (satisfied === normalized) return
    satisfied = normalized
    onChange?.(satisfied)
  }

  const evaluate = () => {
    if (!waitFor?.predicate || !context || destroyed) {
      return
    }
    const checkId = ++lastCheckId
    let result: boolean | PromiseLike<boolean>
    try {
      result = waitFor.predicate(context)
    } catch (error) {
      warn('[tour][waitFor] predicate threw an error', error)
      update(false)
      return
    }

    if (isPromiseLike(result)) {
      result.then(
        (value) => {
          if (destroyed || checkId !== lastCheckId) return
          update(Boolean(value))
        },
        (error: unknown) => {
          if (destroyed || checkId !== lastCheckId) return
          warn('[tour][waitFor] predicate rejected', error)
          update(false)
        },
      )
      return
    }

    update(Boolean(result))
  }

  const attachSubscription = () => {
    if (!waitFor?.subscribe || !context) return
    try {
      const cleanup = waitFor.subscribe({
        ...context,
        notify: (nextValue?: boolean) => {
          if (destroyed) return
          if (typeof nextValue === 'boolean') {
            update(nextValue)
            return
          }
          evaluate()
        },
      })
      if (typeof cleanup === 'function') {
        subscriptionCleanup = cleanup
      }
    } catch (error) {
      warn('[tour][waitFor] subscribe handler threw an error', error)
    }
  }

  const start = () => {
    destroyed = false
    satisfied = !hasPredicate && !hasSubscription
    lastCheckId = 0
    if (waitFor?.predicate && context) {
      evaluate()
      const pollMs = Math.max(0, waitFor.pollMs ?? 200)
      if (pollMs > 0) {
        pollId = window.setInterval(evaluate, pollMs)
      }
    }
    attachSubscription()
  }

  const stop = () => {
    destroyed = true
    if (pollId !== null) {
      window.clearInterval(pollId)
      pollId = null
    }
    if (subscriptionCleanup) {
      try {
        subscriptionCleanup()
      } catch (error) {
        warn('[tour][waitFor] subscribe cleanup threw an error', error)
      }
      subscriptionCleanup = null
    }
  }

  const isSatisfied = () => {
    if (!waitFor) return true
    if (!hasPredicate && !hasSubscription) return true
    return satisfied
  }

  return {
    start,
    stop,
    evaluate,
    isSatisfied,
  }
}
