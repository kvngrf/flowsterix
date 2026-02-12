import type { Step, StepScrollMode } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useTour } from '../context'
import type { ClientRectLike } from '../utils/dom'
import {
  getClientRect,
  getScrollParents,
  getViewportRect,
  isBrowser,
} from '../utils/dom'
import type { ScrollMargin } from './scrollMargin'
import { DEFAULT_SCROLL_MARGIN, resolveScrollMargin } from './scrollMargin'
import type { WaitForPredicateController } from './waitForPredicate'
import { createWaitForPredicateController } from './waitForPredicate'

export type TourTargetVisibility =
  | 'unknown'
  | 'visible'
  | 'hidden'
  | 'detached'
  | 'missing'

export type TourRectSource = 'none' | 'live' | 'stored' | 'viewport'

export interface TourTargetInfo {
  element: Element | null
  rect: ClientRectLike | null
  lastResolvedRect: ClientRectLike | null
  isScreen: boolean
  status: 'idle' | 'resolving' | 'ready'
  stepId: string | null
  lastUpdated: number
  visibility: TourTargetVisibility
  rectSource: TourRectSource
}

const INITIAL_TARGET_INFO: TourTargetInfo = {
  element: null,
  rect: null,
  lastResolvedRect: null,
  isScreen: false,
  status: 'idle',
  stepId: null,
  lastUpdated: 0,
  visibility: 'unknown',
  rectSource: 'none',
}

const DEFAULT_SCROLL_MODE: StepScrollMode = 'center'

const MAX_AUTO_SCROLL_CHECKS = 10
const STALLED_CHECKS_BEFORE_AUTO = 4
const RECT_PROGRESS_THRESHOLD = 0.5

const lastResolvedRectByStep = new Map<string, ClientRectLike>()

type ScrollBehaviorSetting = ScrollBehavior | undefined

type ScrollOptions = {
  behavior?: ScrollBehaviorSetting
  durationMs?: number
}

const rectHasMeaningfulSize = (rect: ClientRectLike | null) =>
  !!rect &&
  rect.width > 0 &&
  rect.height > 0 &&
  Number.isFinite(rect.top) &&
  Number.isFinite(rect.left)

const computeRectSource = (
  rect: ClientRectLike | null,
  storedRect: ClientRectLike | null,
  isScreen: boolean,
): TourRectSource => {
  if (isScreen) return 'viewport'
  if (rectHasMeaningfulSize(rect)) return 'live'
  if (storedRect) return 'stored'
  return 'none'
}

const computeVisibilityState = (
  element: Element | null,
  rect: ClientRectLike | null,
  isScreen: boolean,
): TourTargetVisibility => {
  if (!isBrowser) return 'unknown'
  if (isScreen) return 'visible'
  if (!element) return 'missing'
  if (!document.documentElement.contains(element)) return 'detached'
  const style = window.getComputedStyle(element)
  const hiddenByStyle =
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse'
  const transparent = Number.parseFloat(style.opacity || '1') === 0
  if (hiddenByStyle || transparent) {
    return 'hidden'
  }
  if (!rectHasMeaningfulSize(rect)) {
    return 'hidden'
  }
  return 'visible'
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

let windowScrollAnimationToken = 0

const getWindowScrollY = () => {
  if (!isBrowser) return 0
  const scrollingElement = document.scrollingElement
  return scrollingElement?.scrollTop ?? window.scrollY ?? 0
}

const setWindowScrollY = (value: number) => {
  if (!isBrowser) return
  const scrollingElement = document.scrollingElement
  if (scrollingElement) {
    scrollingElement.scrollTop = value
    return
  }
  document.documentElement.scrollTop = value
  document.body.scrollTop = value
}

const animateWindowScrollBy = (topDelta: number, durationMs: number) => {
  if (!isBrowser) return
  if (!Number.isFinite(topDelta) || Math.abs(topDelta) < 0.5) return

  const startY = getWindowScrollY()
  const targetY = startY + topDelta
  const scrollingElement = document.scrollingElement ?? document.documentElement
  const maxScrollY = Math.max(
    0,
    scrollingElement.scrollHeight - scrollingElement.clientHeight,
  )
  const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY))
  const distance = clampedTargetY - startY
  if (Math.abs(distance) < 0.5) return

  const duration = Math.max(0, durationMs)
  const startTime = performance.now()
  const token = (windowScrollAnimationToken += 1)

  const tick = (now: number) => {
    if (token !== windowScrollAnimationToken) return
    const elapsed = now - startTime
    const progress = duration === 0 ? 1 : clamp01(elapsed / duration)
    const eased = easeInOutCubic(progress)
    const nextY = startY + distance * eased
    setWindowScrollY(nextY)
    if (progress < 1) {
      window.requestAnimationFrame(tick)
    }
  }

  window.requestAnimationFrame(tick)
}

const scrollContainerBy = (
  container: Element,
  topDelta: number,
  leftDelta: number,
  options?: ScrollOptions,
) => {
  if (!isBrowser) return
  if (Math.abs(topDelta) < 0.5 && Math.abs(leftDelta) < 0.5) {
    return
  }

  const behavior = options?.behavior
  const durationMs = options?.durationMs

  const isRootContainer =
    container === document.body ||
    container === document.documentElement ||
    container === document.scrollingElement

  if (isRootContainer) {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      animateWindowScrollBy(topDelta, durationMs)
      if (Math.abs(leftDelta) >= 0.5) {
        window.scrollBy({ left: leftDelta, behavior: behavior ?? 'auto' })
      }
      return
    }
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

type ScrollMode = StepScrollMode

interface EnsureInViewOptions {
  behavior?: ScrollBehaviorSetting
  durationMs?: number
  mode?: ScrollMode
}

const alignWithinViewport = (
  element: Element,
  margin: ScrollMargin,
  behavior: ScrollBehaviorSetting,
  durationMs: number | undefined,
  mode: ScrollMode,
) => {
  if (mode === 'preserve') return
  const viewportRect = getViewportRect()
  const finalRect = getClientRect(element)
  const availableHeight = viewportRect.height - (margin.top + margin.bottom)
  if (availableHeight <= 0) return

  const desiredTop =
    mode === 'center'
      ? margin.top + (availableHeight - finalRect.height) / 2
      : margin.top
  const delta = finalRect.top - desiredTop
  if (Math.abs(delta) < 0.5) return

  if (typeof durationMs === 'number' && durationMs >= 0) {
    animateWindowScrollBy(delta, durationMs)
    return
  }

  window.scrollBy({
    top: delta,
    behavior: behavior ?? 'auto',
  })
}

const ensureElementInView = (
  element: Element,
  margin: ScrollMargin,
  options?: EnsureInViewOptions,
) => {
  const behavior = options?.behavior ?? 'auto'
  const durationMs = options?.durationMs
  const mode: ScrollMode = options?.mode ?? 'preserve'
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
    if (targetRect.top < containerRect.top + margin.top) {
      topDelta = targetRect.top - (containerRect.top + margin.top)
    } else if (targetRect.bottom > containerRect.bottom - margin.bottom) {
      topDelta = targetRect.bottom - (containerRect.bottom - margin.bottom)
    }

    let leftDelta = 0
    if (targetRect.left < containerRect.left + margin.left) {
      leftDelta = targetRect.left - (containerRect.left + margin.left)
    } else if (targetRect.right > containerRect.right - margin.right) {
      leftDelta = targetRect.right - (containerRect.right - margin.right)
    }

    if (topDelta !== 0 || leftDelta !== 0) {
      scrollContainerBy(container, topDelta, leftDelta, {
        behavior,
        durationMs,
      })
    }
  }

  const viewportRect = getViewportRect()
  const finalRect = getClientRect(element)

  let viewportTopDelta = 0
  if (finalRect.top < viewportRect.top + margin.top) {
    viewportTopDelta = finalRect.top - (viewportRect.top + margin.top)
  } else if (finalRect.bottom > viewportRect.bottom - margin.bottom) {
    viewportTopDelta = finalRect.bottom - (viewportRect.bottom - margin.bottom)
  }

  let viewportLeftDelta = 0
  if (finalRect.left < viewportRect.left + margin.left) {
    viewportLeftDelta = finalRect.left - (viewportRect.left + margin.left)
  } else if (finalRect.right > viewportRect.right - margin.right) {
    viewportLeftDelta = finalRect.right - (viewportRect.right - margin.right)
  }

  if (viewportTopDelta !== 0 || viewportLeftDelta !== 0) {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      animateWindowScrollBy(viewportTopDelta, durationMs)
      if (Math.abs(viewportLeftDelta) >= 0.5) {
        window.scrollBy({ left: viewportLeftDelta, behavior: behavior ?? 'auto' })
      }
    } else {
      window.scrollBy({
        top: viewportTopDelta,
        left: viewportLeftDelta,
        behavior,
      })
    }
  }

  alignWithinViewport(element, margin, behavior, durationMs, mode)
}

const resolveStepTarget = (
  target: Step<ReactNode>['target'],
): Element | null => {
  if (!isBrowser) return null
  if (target === 'screen') {
    return null
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
  const { activeStep, state, activeFlowId, flows } = useTour()
  const [targetInfo, setTargetInfo] =
    useState<TourTargetInfo>(INITIAL_TARGET_INFO)
  const autoScrollStateRef = useRef<{
    stepId: string | null
    checks: number
    stalledChecks: number
    done: boolean
    lastRect: ClientRectLike | null
  }>({
    stepId: null,
    checks: 0,
    stalledChecks: 0,
    done: false,
    lastRect: null,
  })
  const autoScrollRafRef = useRef<number | null>(null)
  const autoScrollTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null)
  const lastRectRef = useRef<ClientRectLike | null>(null)
  const initialScrollStepRef = useRef<string | null>(null)

  const cancelAutoScrollLoop = () => {
    if (!isBrowser) return
    if (autoScrollTimeoutRef.current !== null) {
      globalThis.clearTimeout(autoScrollTimeoutRef.current)
      autoScrollTimeoutRef.current = null
    }
    if (autoScrollRafRef.current !== null) {
      window.cancelAnimationFrame(autoScrollRafRef.current)
      autoScrollRafRef.current = null
    }
  }

  useEffect(() => {
    if (!activeStep) {
      initialScrollStepRef.current = null
    }
    return () => {
      initialScrollStepRef.current = null
    }
  }, [activeStep?.id])

  useEffect(() => {
    if (!isBrowser) return
    if (!activeStep || !state || state.status !== 'running') return
    if (typeof activeStep.targetBehavior?.scrollDurationMs !== 'number') return

    const html = document.documentElement
    const body = document.body
    const previousHtmlScrollBehavior = html.style.scrollBehavior
    const previousBodyScrollBehavior = body.style.scrollBehavior

    html.style.scrollBehavior = 'auto'
    body.style.scrollBehavior = 'auto'

    return () => {
      html.style.scrollBehavior = previousHtmlScrollBehavior
      body.style.scrollBehavior = previousBodyScrollBehavior
    }
  }, [activeStep?.id, activeStep?.targetBehavior?.scrollDurationMs, state?.status])

  useLayoutEffect(() => {
    if (!isBrowser) return
    if (!activeStep) return
    if (targetInfo.status !== 'ready') return
    if (targetInfo.isScreen) return
    if (!targetInfo.element) return

    if (initialScrollStepRef.current === activeStep.id) {
      return
    }

    initialScrollStepRef.current = activeStep.id

    const margin = resolveScrollMargin(
      activeStep.targetBehavior?.scrollMargin,
      DEFAULT_SCROLL_MARGIN,
    )

    const scrollMode: ScrollMode =
      activeStep.targetBehavior?.scrollMode ?? DEFAULT_SCROLL_MODE
    const scrollDurationMs = activeStep.targetBehavior?.scrollDurationMs
    const measurementRect = targetInfo.rect ?? targetInfo.lastResolvedRect
    const viewport = getViewportRect()
    const availableHeight = viewport.height - (margin.top + margin.bottom)
    const availableWidth = viewport.width - (margin.left + margin.right)
    const fitsHeight = Boolean(
      measurementRect && measurementRect.height <= availableHeight,
    )
    const fitsWidth = Boolean(
      measurementRect && measurementRect.width <= availableWidth,
    )
    const resolvedScrollMode: ScrollMode =
      measurementRect && (!fitsHeight || !fitsWidth) ? 'preserve' : scrollMode

    const hasLiveRect = targetInfo.rectSource === 'live'
    const scrollBehavior: ScrollBehaviorSetting = hasLiveRect
      ? 'smooth'
      : 'auto'

    ensureElementInView(targetInfo.element, margin, {
      behavior: scrollBehavior,
      durationMs:
        scrollBehavior === 'smooth' ? scrollDurationMs : undefined,
      mode: resolvedScrollMode,
    })
  }, [
    activeStep?.id,
    activeStep?.targetBehavior?.scrollMargin,
    activeStep?.targetBehavior?.scrollMode,
    activeStep?.targetBehavior?.scrollDurationMs,
    targetInfo.rect,
    targetInfo.lastResolvedRect,
    targetInfo.element,
    targetInfo.isScreen,
    targetInfo.status,
    targetInfo.rectSource,
  ])

  useEffect(() => {
    if (!activeStep || !state || state.status !== 'running') {
      setTargetInfo(INITIAL_TARGET_INFO)
      autoScrollStateRef.current = {
        stepId: null,
        checks: 0,
        stalledChecks: 0,
        done: false,
        lastRect: null,
      }
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
        visibility: 'unknown',
        rectSource: storedRect ? 'stored' : 'none',
      })
      return
    }

    const currentStep = activeStep
    const activeFlow = activeFlowId ? (flows.get(activeFlowId) ?? null) : null

    const isScreen = currentStep.target === 'screen'
    const waitForSelectorRaw = currentStep.waitFor?.selector
    const waitForSelector =
      typeof waitForSelectorRaw === 'string'
        ? waitForSelectorRaw.trim()
        : undefined
    const hasWaitForSelector = Boolean(waitForSelector)
    const waitForTimeout = Math.max(0, currentStep.waitFor?.timeout ?? 8000)
    const waitContext = activeFlow
      ? {
          flow: activeFlow,
          state,
          step: currentStep,
        }
      : null

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
    let waitForPredicateController: WaitForPredicateController | null = null

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

    const isWaitForSelectorSatisfied = () => {
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

    const isWaitForSatisfied = () => {
      const selectorReady = !hasWaitForSelector || isWaitForSelectorSatisfied()
      const predicateReady = waitForPredicateController?.isSatisfied() ?? true
      return selectorReady && predicateReady
    }

    function updateTargetState(
      status: 'resolving' | 'ready',
      rectOverride?: ClientRectLike | null,
    ) {
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

      const visibility = computeVisibilityState(element ?? null, rect, isScreen)
      const rectSource = computeRectSource(rect, lastResolvedRect, isScreen)

      setTargetInfo({
        element: element ?? null,
        rect,
        lastResolvedRect,
        isScreen,
        status: nextStatus,
        stepId: currentStep.id,
        lastUpdated: Date.now(),
        visibility,
        rectSource,
      })
    }

    const commitInfo = (status: 'resolving' | 'ready') => {
      updateTargetState(status)
    }

    waitForPredicateController = createWaitForPredicateController<ReactNode>({
      waitFor: currentStep.waitFor,
      context: waitContext,
      onChange: () => {
        updateTargetState(element ? 'ready' : 'resolving')
      },
    })

    waitForPredicateController.start()

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
      waitForPredicateController?.stop()
      waitForPredicateController = null
    }
  }, [activeStep, activeFlowId, flows, state])

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
      autoState.checks = 0
      autoState.stalledChecks = 0
      autoState.done = false
      autoState.lastRect = null
      cancelAutoScrollLoop()
    } else if (autoState.done) {
      cancelAutoScrollLoop()
      return
    }

    const { element } = targetInfo
    const scrollMode: ScrollMode =
      activeStep.targetBehavior?.scrollMode ?? 'center'
    const scrollDurationMs = activeStep.targetBehavior?.scrollDurationMs

    const runCheck = () => {
      autoScrollRafRef.current = null

      if (!isBrowser) return
      if (autoState.stepId !== activeStep.id) return
      if (!element.isConnected) return

      const rect = getClientRect(element)
      const viewport = getViewportRect()
      const margin = resolveScrollMargin(
        activeStep.targetBehavior?.scrollMargin,
        DEFAULT_SCROLL_MARGIN,
      )

      const fitsHeight =
        rect.height <= viewport.height - (margin.top + margin.bottom)
      const fitsWidth =
        rect.width <= viewport.width - (margin.left + margin.right)

      const verticalSatisfied = fitsHeight
        ? rect.top >= margin.top &&
          rect.bottom <= viewport.height - margin.bottom
        : rect.top <= margin.top &&
          rect.bottom >= viewport.height - margin.bottom

      const horizontalSatisfied = fitsWidth
        ? rect.left >= margin.left &&
          rect.right <= viewport.width - margin.right
        : rect.left <= margin.left &&
          rect.right >= viewport.width - margin.right

      if (verticalSatisfied && horizontalSatisfied) {
        autoState.done = true
        return
      }

      autoState.checks += 1
      if (autoState.checks >= MAX_AUTO_SCROLL_CHECKS) {
        autoState.done = true
        return
      }

      const previousRect = autoState.lastRect
      const hasProgress =
        !previousRect ||
        Math.abs(previousRect.top - rect.top) > RECT_PROGRESS_THRESHOLD ||
        Math.abs(previousRect.left - rect.left) > RECT_PROGRESS_THRESHOLD ||
        Math.abs(previousRect.bottom - rect.bottom) > RECT_PROGRESS_THRESHOLD ||
        Math.abs(previousRect.right - rect.right) > RECT_PROGRESS_THRESHOLD

      autoState.lastRect = rect

      if (hasProgress) {
        autoState.stalledChecks = 0
      } else {
        autoState.stalledChecks += 1
      }

      const oversizedTarget = !fitsHeight || !fitsWidth

      const behavior: ScrollBehaviorSetting =
        autoState.stalledChecks >= STALLED_CHECKS_BEFORE_AUTO
          ? 'auto'
          : 'smooth'

      // For oversized targets, the initial step-enter scroll is enough in practice.
      // Additional auto-loop dispatches can fight constrained scroll lock and cause
      // small up/down jitter when the target re-enters viewport.
      if (oversizedTarget) {
        autoState.done = true
      }

      const shouldDispatchScroll = !oversizedTarget &&
        (behavior === 'auto' || !hasProgress || autoState.checks <= 1)

      if (shouldDispatchScroll) {
        ensureElementInView(element, margin, {
          behavior,
          durationMs:
            behavior === 'smooth' ? scrollDurationMs : undefined,
          mode: oversizedTarget ? 'preserve' : scrollMode,
        })
      }

      if (autoState.done) {
        return
      }

      autoScrollTimeoutRef.current = globalThis.setTimeout(() => {
        autoScrollRafRef.current = window.requestAnimationFrame(runCheck)
      }, 120)
    }

    cancelAutoScrollLoop()
    autoScrollRafRef.current = window.requestAnimationFrame(runCheck)

    return cancelAutoScrollLoop
  }, [
    activeStep,
    activeStep?.targetBehavior?.scrollMode,
    activeStep?.targetBehavior?.scrollDurationMs,
    targetInfo,
  ])

  return targetInfo
}
