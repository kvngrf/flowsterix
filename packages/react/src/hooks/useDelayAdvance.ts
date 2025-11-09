import { useEffect, useMemo, useState } from 'react'

import { useTour } from '../context'
import { isBrowser } from '../utils/dom'

export interface DelayAdvanceProgress {
  isActive: boolean
  flowId: string | null
  stepId: string | null
  totalMs: number
  remainingMs: number
  elapsedMs: number
  fractionElapsed: number
  fractionRemaining: number
  startedAt: number | null
  endsAt: number | null
}

const getTimestamp = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

export const useDelayAdvance = (): DelayAdvanceProgress => {
  const { delayInfo, activeStep, state } = useTour()
  const [now, setNow] = useState(() => getTimestamp())

  useEffect(() => {
    if (!delayInfo) return
    if (!activeStep || activeStep.id !== delayInfo.stepId) return
    if (!state || state.status !== 'running') return
    if (!isBrowser) return

    let frameId: number | null = null

    const tick = () => {
      setNow(getTimestamp())
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [delayInfo, activeStep, state])

  useEffect(() => {
    if (!delayInfo) {
      setNow(getTimestamp())
    }
  }, [delayInfo])

  return useMemo(() => {
    const matchingStep =
      !!delayInfo && !!activeStep && activeStep.id === delayInfo.stepId
    const isRunning = matchingStep && state?.status === 'running'

    if (!delayInfo) {
      return {
        isActive: false,
        flowId: null,
        stepId: null,
        totalMs: 0,
        remainingMs: 0,
        elapsedMs: 0,
        fractionElapsed: 0,
        fractionRemaining: 1,
        startedAt: null,
        endsAt: null,
      }
    }

    if (!isRunning) {
      return {
        isActive: false,
        flowId: delayInfo.flowId,
        stepId: delayInfo.stepId,
        totalMs: delayInfo.totalMs,
        remainingMs: delayInfo.totalMs,
        elapsedMs: 0,
        fractionElapsed: 0,
        fractionRemaining: 1,
        startedAt: delayInfo.startedAt,
        endsAt: delayInfo.endsAt,
      }
    }

    const clampedNow = Math.min(now, delayInfo.endsAt)
    const elapsedMs = Math.max(0, clampedNow - delayInfo.startedAt)
    const remainingMs = Math.max(0, delayInfo.endsAt - now)
    const totalMs = delayInfo.totalMs
    const fractionElapsed =
      totalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : 1
    const fractionRemaining = 1 - fractionElapsed

    return {
      isActive: true,
      flowId: delayInfo.flowId,
      stepId: delayInfo.stepId,
      totalMs,
      remainingMs,
      elapsedMs,
      fractionElapsed,
      fractionRemaining,
      startedAt: delayInfo.startedAt,
      endsAt: delayInfo.endsAt,
    }
  }, [activeStep, delayInfo, now, state])
}
