import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { isBrowser } from '../utils/dom'
import type { TourTargetInfo } from './useTourTarget'

const DEFAULT_DELAY_MS = 900
const DEFAULT_GRACE_PERIOD_MS = 400

type HiddenMode = NonNullable<Step<ReactNode>['targetBehavior']>['hidden']

export interface UseHiddenTargetFallbackConfig {
  step: Step<ReactNode> | null
  target: TourTargetInfo
  viewportRect: ClientRectLike
  onSkip: () => void
}

export interface UseHiddenTargetFallbackResult {
  target: TourTargetInfo
  usingScreenFallback: boolean
  /**
   * True during the initial grace period while waiting for target to resolve.
   * During this time, backdrop should show but popover should be hidden.
   */
  isInGracePeriod: boolean
}

export const useHiddenTargetFallback = ({
  step,
  target,
  viewportRect,
  onSkip,
}: UseHiddenTargetFallbackConfig): UseHiddenTargetFallbackResult => {
  const [usingScreenFallback, setUsingScreenFallback] = useState(false)
  const [isInGracePeriod, setIsInGracePeriod] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipTriggeredRef = useRef(false)

  const hiddenMode: HiddenMode = step?.targetBehavior?.hidden ?? 'screen'
  const hiddenDelayMs = Math.max(
    0,
    step?.targetBehavior?.hiddenDelayMs ?? DEFAULT_DELAY_MS,
  )

  const clearPendingTimeout = () => {
    if (timeoutRef.current !== null) {
      globalThis.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const clearGraceTimeout = () => {
    if (graceTimeoutRef.current !== null) {
      globalThis.clearTimeout(graceTimeoutRef.current)
      graceTimeoutRef.current = null
    }
  }

  useEffect(() => {
    skipTriggeredRef.current = false
    setUsingScreenFallback(false)
    setIsInGracePeriod(false)
    clearPendingTimeout()
    clearGraceTimeout()
    return () => {
      clearPendingTimeout()
      clearGraceTimeout()
    }
  }, [step?.id])

  useEffect(() => {
    if (!isBrowser) return undefined
    if (!step) return undefined
    clearPendingTimeout()
    clearGraceTimeout()

    // Handle hidden/detached (element found but not visible) - status is 'ready'
    const isHiddenOrDetached =
      (target.visibility === 'hidden' || target.visibility === 'detached') &&
      target.status === 'ready'

    // Handle missing (element never found, no rect data) - status is 'resolving'
    const isMissingWithNoRect =
      target.visibility === 'missing' &&
      target.status === 'resolving' &&
      target.rect === null &&
      target.lastResolvedRect === null

    // Handle missing after navigation (target was found before but now gone)
    // lastResolvedRect may still have old position - that's expected after navigation
    const isMissingAfterNavigation =
      target.visibility === 'missing' &&
      target.status === 'resolving' &&
      target.rect === null

    const shouldHandleHiddenTarget =
      !target.isScreen &&
      (isHiddenOrDetached ||
        isMissingWithNoRect ||
        isMissingAfterNavigation)

    if (!shouldHandleHiddenTarget) {
      setUsingScreenFallback(false)
      setIsInGracePeriod(false)
      return undefined
    }

    // Enter grace period immediately when target is not visible
    setIsInGracePeriod(true)

    if (hiddenMode !== 'screen') {
      setUsingScreenFallback(false)
    }

    // After grace period, exit grace and allow fallback UI to show
    graceTimeoutRef.current = globalThis.setTimeout(() => {
      setIsInGracePeriod(false)
    }, DEFAULT_GRACE_PERIOD_MS)

    // After full delay, trigger screen fallback or skip
    timeoutRef.current = globalThis.setTimeout(() => {
      if (hiddenMode === 'screen') {
        setUsingScreenFallback(true)
        return
      }
      if (!skipTriggeredRef.current) {
        skipTriggeredRef.current = true
        onSkip()
      }
    }, hiddenDelayMs)

    return () => {
      clearPendingTimeout()
      clearGraceTimeout()
    }
  }, [
    step,
    target.visibility,
    target.isScreen,
    target.status,
    target.rect,
    target.lastResolvedRect,
    hiddenMode,
    hiddenDelayMs,
    onSkip,
  ])

  const resolvedTarget = useMemo<TourTargetInfo>(() => {
    if (!usingScreenFallback) {
      return target
    }

    return {
      ...target,
      element: null,
      rect: viewportRect,
      lastResolvedRect: viewportRect,
      isScreen: true,
      rectSource: 'viewport',
      visibility: 'visible',
    }
  }, [target, usingScreenFallback, viewportRect])

  return {
    target: resolvedTarget,
    usingScreenFallback,
    isInGracePeriod,
  }
}
