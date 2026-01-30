import type {
  FlowHudOptions,
  FlowHudRenderMode,
  FlowState,
  Step,
} from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTour } from '../context'
import { useAdvanceRules } from './useAdvanceRules'
import { useHiddenTargetFallback } from './useHiddenTargetFallback'
import { useRouteMismatch } from './useRouteMismatch'
import type { TourTargetInfo } from './useTourTarget'
import { useTourTarget } from './useTourTarget'
import { useViewportRect } from './useViewportRect'

export interface UseHudStateOptions {
  /**
   * Limit the HUD runtime to a specific flow or set of flows.
   * When provided, the hook behaves as if the HUD is idle whenever
   * the active flow does not match one of the allowed identifiers.
   */
  flowId?: string | Array<string>
}

export interface UseHudStateResult {
  state: FlowState | null
  runningState: FlowState | null
  runningStep: Step<ReactNode> | null
  shouldRender: boolean
  canRenderStep: boolean
  focusTrapActive: boolean
  target: TourTargetInfo
  hudTarget: TourTargetInfo
  flowHudOptions: FlowHudOptions | null
  hudRenderMode: FlowHudRenderMode
  matchesFlowFilter: boolean
  activeFlowId: string | null
  /**
   * True during grace period while waiting for target to resolve.
   * Backdrop should show but popover should be hidden.
   */
  isInGracePeriod: boolean
}

const EXIT_BUFFER_MS = 450

const normalizeFlowFilter = (value?: string | Array<string>) => {
  if (!value) return null
  return Array.isArray(value) ? value : [value]
}

export const useHudState = (
  options: UseHudStateOptions = {},
): UseHudStateResult => {
  const { flowId } = options
  const flowFilter = useMemo(() => normalizeFlowFilter(flowId), [flowId])
  const { state, activeStep, activeFlowId, flows, next, complete, pause, resume } = useTour()
  const target = useTourTarget()
  const viewportRect = useViewportRect()

  useAdvanceRules(target)

  const matchesFlowFilter = useMemo(() => {
    if (!flowFilter || flowFilter.length === 0) return true
    if (!activeFlowId) return false
    return flowFilter.includes(activeFlowId)
  }, [activeFlowId, flowFilter])

  const isRunning = state?.status === 'running'
  const runningState = isRunning && matchesFlowFilter ? state : null
  const runningStep = runningState && activeStep ? activeStep : null
  const [shouldRender, setShouldRender] = useState<boolean>(
    Boolean(runningStep),
  )

  useEffect(() => {
    if (runningStep) {
      setShouldRender(true)
    }
  }, [runningStep?.id])

  useEffect(() => {
    if (!shouldRender) return
    if (runningStep) return
    if (target.status !== 'idle') return

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
    }, EXIT_BUFFER_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [runningStep, shouldRender, target.status])

  const { isRouteMismatch, currentPath } = useRouteMismatch(activeStep)

  // Track if we paused due to missing target (not route mismatch)
  const pausedForMissingTargetRef = useRef<string | null>(null)

  // Pause flow when route doesn't match
  useEffect(() => {
    if (!isRouteMismatch) return
    if (!runningState || runningState.status !== 'running') return
    pause()
  }, [isRouteMismatch, runningState, pause])

  // Auto-resume when route matches again (but not if paused for missing target)
  useEffect(() => {
    if (isRouteMismatch) return
    if (pausedForMissingTargetRef.current !== null) return
    if (!state || state.status !== 'paused') return
    resume()
  }, [isRouteMismatch, state, resume])

  const skipHiddenStep = useCallback(() => {
    if (!runningState || runningState.status !== 'running') return
    if (!activeFlowId) return
    const flow = flows.get(activeFlowId)
    if (!flow) return
    const isLastStep =
      runningState.stepIndex >= flow.steps.length - 1 && flow.steps.length > 0
    if (isLastStep) {
      complete()
    } else {
      next()
    }
  }, [activeFlowId, complete, flows, next, runningState])

  const { target: hudTarget, isInGracePeriod } = useHiddenTargetFallback({
    step: runningStep,
    target,
    viewportRect,
    onSkip: skipHiddenStep,
  })

  // Pause flow when target is missing (for steps without route constraint)
  useEffect(() => {
    if (isRouteMismatch) return
    if (activeStep?.route !== undefined) return
    if (isInGracePeriod) return
    if (target.visibility !== 'missing') return
    if (target.isScreen) return
    if (!runningState || runningState.status !== 'running') return
    pausedForMissingTargetRef.current = currentPath
    pause()
  }, [
    isRouteMismatch,
    activeStep?.route,
    isInGracePeriod,
    target.visibility,
    target.isScreen,
    runningState,
    currentPath,
    pause,
  ])

  // Auto-resume when path changes (after pausing for missing target)
  useEffect(() => {
    if (pausedForMissingTargetRef.current === null) return
    if (!state || state.status !== 'paused') return
    if (currentPath === pausedForMissingTargetRef.current) return
    pausedForMissingTargetRef.current = null
    resume()
  }, [currentPath, state, resume])

  // Clear missing target pause state when step changes
  useEffect(() => {
    pausedForMissingTargetRef.current = null
  }, [activeStep?.id])

  const canRenderStep = Boolean(runningStep && runningState)
  const focusTrapActive = canRenderStep

  const flowHudOptions =
    matchesFlowFilter && activeFlowId
      ? (flows.get(activeFlowId)?.hud ?? null)
      : null
  const hudRenderMode: FlowHudRenderMode = flowHudOptions?.render ?? 'default'

  return {
    state,
    runningState,
    runningStep,
    shouldRender,
    canRenderStep,
    focusTrapActive,
    target,
    hudTarget,
    flowHudOptions,
    hudRenderMode,
    matchesFlowFilter,
    activeFlowId,
    isInGracePeriod,
  }
}
