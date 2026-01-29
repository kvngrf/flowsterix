import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { isBrowser } from '../utils/dom'
import type { TourTargetInfo } from './useTourTarget'

const DEFAULT_DELAY_MS = 900

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
}

export const useHiddenTargetFallback = ({
  step,
  target,
  viewportRect,
  onSkip,
}: UseHiddenTargetFallbackConfig): UseHiddenTargetFallbackResult => {
  const [usingScreenFallback, setUsingScreenFallback] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  useEffect(() => {
    skipTriggeredRef.current = false
    setUsingScreenFallback(false)
    clearPendingTimeout()
    return clearPendingTimeout
  }, [step?.id])

  useEffect(() => {
    if (!isBrowser) return undefined
    if (!step) return undefined
    clearPendingTimeout()

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

    const shouldHandleHiddenTarget =
      !target.isScreen && (isHiddenOrDetached || isMissingWithNoRect)

    if (!shouldHandleHiddenTarget) {
      setUsingScreenFallback(false)
      return undefined
    }

    if (hiddenMode !== 'screen') {
      setUsingScreenFallback(false)
    }

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

    return clearPendingTimeout
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
  }
}
