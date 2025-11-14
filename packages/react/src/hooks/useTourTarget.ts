import type { Step } from '@tour/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { useTour } from '../context'
import type { ClientRectLike } from '../utils/dom'
import {
  getClientRect,
  getScrollParents,
  getViewportRect,
  isBrowser,
} from '../utils/dom'

export interface TourTargetInfo {
  element: Element | null
  rect: ClientRectLike | null
  lastResolvedRect: ClientRectLike | null
  isScreen: boolean
  status: 'idle' | 'resolving' | 'ready'
  stepId: string | null
  lastUpdated: number
}

const INITIAL_TARGET_INFO: TourTargetInfo = {
  element: null,
  rect: null,
  lastResolvedRect: null,
  isScreen: false,
  status: 'idle',
  stepId: null,
  lastUpdated: 0,
}

const lastResolvedRectByStep = new Map<string, ClientRectLike>()

const AUTO_SCROLL_MARGIN = 16

type ScrollBehaviorSetting = ScrollBehavior | undefined

const scrollContainerBy = (
  container: Element,
  topDelta: number,
  leftDelta: number,
  behavior: ScrollBehaviorSetting,
) => {
  if (!isBrowser) return
  if (Math.abs(topDelta) < 0.5 && Math.abs(leftDelta) < 0.5) {
    return
  }

  const isRootContainer =
    container === document.body ||
    container === document.documentElement ||
    container === document.scrollingElement

  if (isRootContainer) {
    window.scrollBy({
      top: topDelta,
      left: leftDelta,
      behavior: behavior ?? 'auto',
    })
    return
  }

  const elementContainer = container as HTMLElement
  if (typeof elementContainer.scrollBy === 'function') {
    elementContainer.scrollBy({
      top: topDelta,
      left: leftDelta,
      behavior: behavior ?? 'auto',
    })
    return
  }

  elementContainer.scrollTop += topDelta
  elementContainer.scrollLeft += leftDelta
}

const ensureElementInView = (
  element: Element,
  margin: number,
  behavior: ScrollBehaviorSetting,
) => {
  if (!isBrowser) return

  const scrollParents = getScrollParents(element)

  const rootScroller = document.scrollingElement
  if (rootScroller && !scrollParents.includes(rootScroller)) {
    scrollParents.push(rootScroller)
  }

  for (const container of scrollParents) {
    const containerRect =
      container === rootScroller ||
      container === document.body ||
      container === document.documentElement
        ? getViewportRect()
        : getClientRect(container)

    const targetRect = getClientRect(element)

    let topDelta = 0
    if (targetRect.top < containerRect.top + margin) {
      topDelta = targetRect.top - (containerRect.top + margin)
    } else if (targetRect.bottom > containerRect.bottom - margin) {
      topDelta = targetRect.bottom - (containerRect.bottom - margin)
    }

    let leftDelta = 0
    if (targetRect.left < containerRect.left + margin) {
      leftDelta = targetRect.left - (containerRect.left + margin)
    } else if (targetRect.right > containerRect.right - margin) {
      leftDelta = targetRect.right - (containerRect.right - margin)
    }

    if (topDelta !== 0 || leftDelta !== 0) {
      scrollContainerBy(container, topDelta, leftDelta, behavior)
    }
  }

  const viewportRect = getViewportRect()
  const finalRect = getClientRect(element)

  let viewportTopDelta = 0
  if (finalRect.top < viewportRect.top + margin) {
    viewportTopDelta = finalRect.top - (viewportRect.top + margin)
  } else if (finalRect.bottom > viewportRect.bottom - margin) {
    viewportTopDelta = finalRect.bottom - (viewportRect.bottom - margin)
  }

  let viewportLeftDelta = 0
  if (finalRect.left < viewportRect.left + margin) {
    viewportLeftDelta = finalRect.left - (viewportRect.left + margin)
  } else if (finalRect.right > viewportRect.right - margin) {
    viewportLeftDelta = finalRect.right - (viewportRect.right - margin)
  }

  if (viewportTopDelta !== 0 || viewportLeftDelta !== 0) {
    window.scrollBy({
      top: viewportTopDelta,
      left: viewportLeftDelta,
      behavior: behavior ?? 'auto',
    })
  }
}

const resolveStepTarget = (
  target: Step<ReactNode>['target'],
): Element | null => {
  if (!isBrowser) return null
  if (target === 'screen') {
    return document.body
  }
  if (target.getNode) {
    try {
      const node = target.getNode()
      if (node) {
        return node
      }
    } catch {
      // ignore resolution errors from user land
    }
  }
  if (target.selector) {
    try {
      return document.querySelector(target.selector)
    } catch {
      return null
    }
  }
  return null
}

export const useTourTarget = (): TourTargetInfo => {
  const { activeStep, state } = useTour()
  const [targetInfo, setTargetInfo] =
    useState<TourTargetInfo>(INITIAL_TARGET_INFO)
  const autoScrollStateRef = useRef<{
    stepId: string | null
    attempts: number
    done: boolean
  }>({ stepId: null, attempts: 0, done: false })
  const autoScrollRafRef = useRef<number | null>(null)
  const autoScrollTimeoutRef = useRef<ReturnType<
    typeof window.setTimeout
  > | null>(null)
  const lastRectRef = useRef<ClientRectLike | null>(null)

  const cancelAutoScrollLoop = () => {
    if (!isBrowser) return
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current)
      autoScrollTimeoutRef.current = null
    }
    if (autoScrollRafRef.current !== null) {
      window.cancelAnimationFrame(autoScrollRafRef.current)
      autoScrollRafRef.current = null
    }
  }

  useEffect(() => {
    if (!activeStep || !state || state.status !== 'running') {
      setTargetInfo(INITIAL_TARGET_INFO)
      autoScrollStateRef.current = { stepId: null, attempts: 0, done: false }
      cancelAutoScrollLoop()
      return
    }

    if (!isBrowser) {
      const storedRect = lastResolvedRectByStep.get(activeStep.id) ?? null
      setTargetInfo({
        element: null,
        rect: null,
        lastResolvedRect: storedRect ? { ...storedRect } : null,
        isScreen: activeStep.target === 'screen',
        status: 'resolving',
        stepId: activeStep.id,
        lastUpdated: Date.now(),
      })
      return
    }

    const currentStep = activeStep

    const isScreen = currentStep.target === 'screen'
    const waitForSelectorRaw = currentStep.waitFor?.selector
    const waitForSelector =
      typeof waitForSelectorRaw === 'string'
        ? waitForSelectorRaw.trim()
        : undefined
    const hasWaitForSelector = Boolean(waitForSelector)
    const waitForTimeout = Math.max(0, currentStep.waitFor?.timeout ?? 8000)

    let cancelled = false
    let resolvePollId: number | null = null
    let waitForPollId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let scrollParents: Array<Element> = []
    const cleanupFns: Array<() => void> = []
    let element: Element | null = null
    let rafId: number | null = null
    let lastStatus: TourTargetInfo['status'] = 'idle'
    let lastElement: Element | null = null
    let hasEmitted = false
    let waitForStartedAt: number | null = null
    let waitForTimedOut = false
    let waitForSelectorWarned = false
    let waitForTimeoutWarned = false

    lastRectRef.current = null

    function clearResolvePolling() {
      if (resolvePollId !== null) {
        window.clearInterval(resolvePollId)
        resolvePollId = null
      }
    }

    function clearWaitForPoll() {
      if (waitForPollId !== null) {
        window.clearInterval(waitForPollId)
        waitForPollId = null
      }
    }

    const rectHasMeaningfulSize = (rect: ClientRectLike | null) =>
      !!rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      Number.isFinite(rect.top) &&
      Number.isFinite(rect.left)

    const rectChanged = (nextRect: ClientRectLike | null) => {
      const previous = lastRectRef.current
      if (!previous || !nextRect) {
        return previous !== nextRect
      }
      const threshold = 0.25
      return (
        Math.abs(previous.top - nextRect.top) > threshold ||
        Math.abs(previous.left - nextRect.left) > threshold ||
        Math.abs(previous.width - nextRect.width) > threshold ||
        Math.abs(previous.height - nextRect.height) > threshold
      )
    }

    const isWaitForSatisfied = () => {
      if (!hasWaitForSelector) return true
      try {
        return document.querySelector(waitForSelector!) !== null
      } catch (error) {
        if (!waitForSelectorWarned && typeof console !== 'undefined') {
          console.warn(
            '[tour][waitFor] selector lookup failed',
            waitForSelector,
            error,
          )
          waitForSelectorWarned = true
        }
        return false
      }
    }

    const updateTargetState = (
      status: 'resolving' | 'ready',
      rectOverride?: ClientRectLike | null,
    ) => {
      if (cancelled) return
      const rect =
        typeof rectOverride !== 'undefined'
          ? rectOverride
          : isScreen
            ? getViewportRect()
            : element
              ? getClientRect(element)
              : null

      if (
        status === 'ready' &&
        hasWaitForSelector &&
        waitForStartedAt === null
      ) {
        waitForStartedAt = Date.now()
      }

      if (
        !waitForTimedOut &&
        waitForTimeout > 0 &&
        waitForStartedAt !== null &&
        Date.now() - waitForStartedAt >= waitForTimeout
      ) {
        waitForTimedOut = true
        if (!waitForTimeoutWarned && typeof console !== 'undefined') {
          console.warn(
            '[tour][waitFor] timeout exceeded for step',
            currentStep.id,
            'selector:',
            waitForSelector,
          )
          waitForTimeoutWarned = true
        }
      }

      const hasRect = rectHasMeaningfulSize(rect)
      const waitConditionMet = waitForTimedOut || isWaitForSatisfied()
      const nextStatus: TourTargetInfo['status'] =
        status === 'ready' && (isScreen || hasRect) && waitConditionMet
          ? 'ready'
          : 'resolving'

      if (waitConditionMet) {
        clearWaitForPoll()
      }

      const storedRect = lastResolvedRectByStep.get(currentStep.id) ?? null

      const shouldUpdate =
        !hasEmitted ||
        rectChanged(rect) ||
        lastStatus !== nextStatus ||
        element !== lastElement

      if (!shouldUpdate) {
        return
      }

      lastRectRef.current = rect ? { ...rect } : null
      lastStatus = nextStatus
      hasEmitted = true
      lastElement = element ?? null

      const shouldPersistRect =
        nextStatus === 'ready' && !isScreen && rectHasMeaningfulSize(rect)
      if (shouldPersistRect && rect) {
        lastResolvedRectByStep.set(currentStep.id, { ...rect })
      }

      const lastResolvedRect =
        shouldPersistRect && rect
          ? { ...rect }
          : storedRect
            ? { ...storedRect }
            : null

      setTargetInfo({
        element: element ?? null,
        rect,
        lastResolvedRect,
        isScreen,
        status: nextStatus,
        stepId: currentStep.id,
        lastUpdated: Date.now(),
      })
    }

    const commitInfo = (status: 'resolving' | 'ready') => {
      updateTargetState(status)
    }

    function stopRaf() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    function startRafMonitor() {
      if (isScreen || !isBrowser) return
      stopRaf()
      const tick = () => {
        if (cancelled) return
        if (!element) {
          updateTargetState('resolving', null)
        } else {
          const rect = getClientRect(element)
          if (rectChanged(rect)) {
            updateTargetState('ready', rect)
          }
        }
        rafId = window.requestAnimationFrame(tick)
      }
      rafId = window.requestAnimationFrame(tick)
      cleanupFns.push(stopRaf)
    }

    function resetObservers() {
      cleanupFns.forEach((dispose) => dispose())
      cleanupFns.length = 0
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (mutationObserver) {
        mutationObserver.disconnect()
        mutationObserver = null
      }
      scrollParents = []
      clearWaitForPoll()
      stopRaf()
    }

    function startObservers() {
      if (cancelled) return

      resetObservers()
      clearResolvePolling()

      if (isScreen) {
        const onResize = () => commitInfo('ready')
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onResize, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onResize)
          window.removeEventListener('scroll', onResize, true)
        })

        if (typeof window !== 'undefined' && window.visualViewport) {
          const onViewportChange = () => commitInfo('ready')
          window.visualViewport.addEventListener('resize', onViewportChange)
          window.visualViewport.addEventListener('scroll', onViewportChange)
          cleanupFns.push(() => {
            window.visualViewport?.removeEventListener(
              'resize',
              onViewportChange,
            )
            window.visualViewport?.removeEventListener(
              'scroll',
              onViewportChange,
            )
          })
        }
      } else if (element) {
        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(() => updateTargetState('ready'))
          resizeObserver.observe(element)
        }
        const onReposition = () => commitInfo('ready')
        window.addEventListener('resize', onReposition)
        window.addEventListener('scroll', onReposition, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onReposition)
          window.removeEventListener('scroll', onReposition, true)
        })

        const onAncestorScroll = () => commitInfo('ready')
        scrollParents = getScrollParents(element)
        if (scrollParents.length > 0) {
          scrollParents.forEach((parent) =>
            parent.addEventListener('scroll', onAncestorScroll, {
              passive: true,
            }),
          )
          cleanupFns.push(() => {
            scrollParents.forEach((parent) =>
              parent.removeEventListener('scroll', onAncestorScroll),
            )
            scrollParents = []
          })
        }

        startRafMonitor()

        if (typeof MutationObserver === 'function') {
          mutationObserver = new MutationObserver(() => {
            if (cancelled) return
            if (element && document.documentElement.contains(element)) {
              return
            }
            resetObservers()
            element = null
            commitInfo('resolving')
            startResolvePolling()
          })
          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
          })
          cleanupFns.push(() => {
            mutationObserver?.disconnect()
            mutationObserver = null
          })
        }
      }

      if (hasWaitForSelector) {
        const pollWaitFor = () => updateTargetState('ready')
        pollWaitFor()
        clearWaitForPoll()
        waitForPollId = window.setInterval(pollWaitFor, 150)
        cleanupFns.push(clearWaitForPoll)
      }

      commitInfo('ready')
    }

    function attemptAttach(): boolean {
      const nextElement = resolveStepTarget(currentStep.target)
      if (isScreen || nextElement) {
        element = nextElement
        startObservers()
        return true
      }
      commitInfo('resolving')
      return false
    }

    function startResolvePolling() {
      clearResolvePolling()
      const pollInterval = 200
      const timeout = waitForTimeout
      const startedAt = Date.now()
      resolvePollId = window.setInterval(() => {
        if (attemptAttach()) {
          clearResolvePolling()
          return
        }
        if (timeout > 0 && Date.now() - startedAt >= timeout) {
          clearResolvePolling()
        }
      }, pollInterval)
    }

    if (!attemptAttach()) {
      startResolvePolling()
    }

    return () => {
      cancelled = true
      clearResolvePolling()
      clearWaitForPoll()
      resetObservers()
    }
  }, [activeStep, state])

  useEffect(() => {
    if (!isBrowser) return
    if (!activeStep) {
      cancelAutoScrollLoop()
      return
    }
    if (targetInfo.status !== 'ready') {
      cancelAutoScrollLoop()
      return
    }
    if (targetInfo.isScreen) {
      cancelAutoScrollLoop()
      return
    }
    if (!targetInfo.element) {
      cancelAutoScrollLoop()
      return
    }

    const autoState = autoScrollStateRef.current
    if (autoState.stepId !== activeStep.id) {
      autoState.stepId = activeStep.id
      autoState.attempts = 0
      autoState.done = false
      cancelAutoScrollLoop()
    } else if (autoState.done) {
      cancelAutoScrollLoop()
      return
    }

    const { element } = targetInfo

    const runCheck = () => {
      autoScrollRafRef.current = null

      if (!isBrowser) return
      if (autoState.stepId !== activeStep.id) return
      if (!element.isConnected) return

      const rect = getClientRect(element)
      const viewport = getViewportRect()
      const margin = AUTO_SCROLL_MARGIN

      const fitsHeight = rect.height <= viewport.height
      const fitsWidth = rect.width <= viewport.width

      const verticalSatisfied = fitsHeight
        ? rect.top >= margin && rect.bottom <= viewport.height - margin
        : rect.top <= margin && rect.bottom >= viewport.height - margin

      const horizontalSatisfied = fitsWidth
        ? rect.left >= margin && rect.right <= viewport.width - margin
        : rect.left <= margin && rect.right >= viewport.width - margin

      if (verticalSatisfied && horizontalSatisfied) {
        autoState.done = true
        return
      }

      if (autoState.attempts >= 6) {
        autoState.done = true
        return
      }

      autoState.attempts += 1

      const behavior: ScrollBehaviorSetting =
        autoState.attempts >= 4 ? 'auto' : 'smooth'

      ensureElementInView(element, margin, behavior)

      autoScrollTimeoutRef.current = window.setTimeout(() => {
        autoScrollRafRef.current = window.requestAnimationFrame(runCheck)
      }, 120)
    }

    cancelAutoScrollLoop()
    autoScrollRafRef.current = window.requestAnimationFrame(runCheck)

    return cancelAutoScrollLoop
  }, [activeStep, targetInfo])

  return targetInfo
}
