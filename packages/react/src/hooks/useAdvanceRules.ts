import type {
  AdvancePredicateContext,
  AdvanceRule,
  FlowDefinition,
} from '@tour/core'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { useTour } from '../context'
import { isBrowser } from '../utils/dom'
import type { TourTargetInfo } from './useTourTarget'

const DEFAULT_POLL_MS = 250
const ROUTE_POLL_MS = 150

type ListenerTarget = EventTarget & {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void
}

const isListenerTarget = (
  value: EventTarget | null | undefined,
): value is ListenerTarget => {
  return (
    !!value &&
    typeof (value as ListenerTarget).addEventListener === 'function' &&
    typeof (value as ListenerTarget).removeEventListener === 'function'
  )
}

const resolveEventTarget = (
  rule: Extract<AdvanceRule, { type: 'event' }>,
  target: TourTargetInfo,
): EventTarget | null => {
  if (!isBrowser) return null
  if (!rule.on || rule.on === 'target') {
    return target.element ?? null
  }
  if (rule.on === 'window') {
    return window
  }
  if (rule.on === 'document') {
    return document
  }
  try {
    return document.querySelector(rule.on)
  } catch {
    return null
  }
}

const matchesRouteRule = (
  rule: Extract<AdvanceRule, { type: 'route' }>,
): boolean => {
  if (!isBrowser) return false
  const path =
    window.location.pathname + window.location.search + window.location.hash
  if (!rule.to) return true
  if (typeof rule.to === 'string') {
    return path === rule.to
  }
  return rule.to.test(path)
}

export const useAdvanceRules = (target: TourTargetInfo) => {
  const {
    activeFlowId,
    flows,
    activeStep,
    state,
    next,
    complete,
    setDelayInfo,
  } = useTour()

  useEffect(() => {
    if (!isBrowser) return
    if (!state || state.status !== 'running') return
    if (!activeStep) return

    const definition: FlowDefinition<ReactNode> | undefined = activeFlowId
      ? flows.get(activeFlowId)
      : undefined
    if (!definition) return

    const rules = activeStep.advance
    if (!rules || rules.length === 0) return

    let resolved = false
    const hasResolved = () => resolved
    const cleanupFns: Array<() => void> = []

    const runCleanup = () => {
      while (cleanupFns.length > 0) {
        const dispose = cleanupFns.pop()
        try {
          dispose?.()
        } catch (error) {
          console.warn('[tour][advance] cleanup failed', error)
        }
      }
    }

    const addCleanup = (fn?: () => void) => {
      if (fn) {
        cleanupFns.push(fn)
      }
    }

    const clearDelayInfo = () => {
      setDelayInfo((info) => {
        if (!info) return null
        if (info.flowId !== definition.id) return info
        if (info.stepId !== activeStep.id) return info
        return null
      })
    }

    const finish = () => {
      if (resolved) return
      resolved = true
      runCleanup()
      clearDelayInfo()

      const totalSteps = definition.steps.length
      if (totalSteps > 0 && state.stepIndex >= totalSteps - 1) {
        complete()
      } else {
        next()
      }
    }

    const predicateCtx: AdvancePredicateContext<ReactNode> = {
      flow: definition,
      state,
      step: activeStep,
    }

    for (const rule of rules) {
      if (hasResolved()) break

      switch (rule.type) {
        case 'manual': {
          break
        }
        case 'delay': {
          const totalMs = Math.max(0, rule.ms)
          const startedAt =
            typeof performance !== 'undefined' ? performance.now() : Date.now()
          const endsAt = startedAt + totalMs

          setDelayInfo({
            flowId: definition.id,
            stepId: activeStep.id,
            totalMs,
            startedAt,
            endsAt,
          })

          const timer = window.setTimeout(() => {
            finish()
          }, totalMs)
          addCleanup(() => window.clearTimeout(timer))
          break
        }
        case 'event': {
          const eventTarget = resolveEventTarget(rule, target)
          if (!isListenerTarget(eventTarget)) {
            continue
          }
          const handler = () => finish()
          eventTarget.addEventListener(rule.event, handler)
          addCleanup(() => {
            eventTarget.removeEventListener(rule.event, handler)
          })
          break
        }
        case 'predicate': {
          const pollMs = Math.max(50, rule.pollMs ?? DEFAULT_POLL_MS)
          const timeoutMs = rule.timeoutMs
          const executeCheck = () => {
            if (resolved) return
            try {
              if (rule.check(predicateCtx)) {
                finish()
              }
            } catch (error) {
              console.warn('[tour][advance] predicate check failed', error)
            }
          }

          executeCheck()
          if (hasResolved()) {
            break
          }

          const intervalId = window.setInterval(executeCheck, pollMs)
          addCleanup(() => window.clearInterval(intervalId))

          if (typeof timeoutMs === 'number' && timeoutMs > 0) {
            const timeoutId = window.setTimeout(() => {
              window.clearInterval(intervalId)
            }, timeoutMs)
            addCleanup(() => window.clearTimeout(timeoutId))
          }
          break
        }
        case 'route': {
          const checkRoute = () => {
            if (resolved) return
            if (matchesRouteRule(rule)) {
              finish()
            }
          }

          checkRoute()
          if (hasResolved()) {
            break
          }

          const handler = () => {
            checkRoute()
          }

          window.addEventListener('hashchange', handler)
          window.addEventListener('popstate', handler)

          let lastPath =
            window.location.pathname +
            window.location.search +
            window.location.hash
          const pollId = window.setInterval(() => {
            const current =
              window.location.pathname +
              window.location.search +
              window.location.hash
            if (current === lastPath) return
            lastPath = current
            handler()
          }, ROUTE_POLL_MS)

          addCleanup(() => {
            window.removeEventListener('hashchange', handler)
            window.removeEventListener('popstate', handler)
            window.clearInterval(pollId)
          })
          break
        }
        default: {
          const neverRule: never = rule
          console.warn('[tour][advance] unsupported advance rule', neverRule)
        }
      }
    }

    return () => {
      resolved = true
      runCleanup()
      clearDelayInfo()
    }
  }, [
    activeFlowId,
    activeStep,
    complete,
    flows,
    next,
    state,
    target.element,
    setDelayInfo,
    target.lastUpdated,
    target.status,
  ])
}
