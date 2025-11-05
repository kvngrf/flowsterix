import type { Step } from '@tour/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { useTour } from '../context'
import type { ClientRectLike } from '../utils/dom'
import {
  getClientRect,
  getViewportRect,
  isBrowser,
  isRectInViewport,
} from '../utils/dom'

export interface TourTargetInfo {
  element: Element | null
  rect: ClientRectLike | null
  isScreen: boolean
  status: 'idle' | 'resolving' | 'ready'
  stepId: string | null
  lastUpdated: number
}

const INITIAL_TARGET_INFO: TourTargetInfo = {
  element: null,
  rect: null,
  isScreen: false,
  status: 'idle',
  stepId: null,
  lastUpdated: 0,
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
  const lastAutoScrollIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeStep || !state || state.status !== 'running') {
      setTargetInfo(INITIAL_TARGET_INFO)
      lastAutoScrollIdRef.current = null
      return
    }

    if (!isBrowser) {
      setTargetInfo({
        element: null,
        rect: null,
        isScreen: activeStep.target === 'screen',
        status: 'resolving',
        stepId: activeStep.id,
        lastUpdated: Date.now(),
      })
      return
    }

    const isScreen = activeStep.target === 'screen'
    let cancelled = false
    let pollId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    const cleanupFns: Array<() => void> = []
    let element: Element | null = null

    const commitInfo = (status: 'resolving' | 'ready') => {
      if (cancelled) return
      const rect = isScreen
        ? getViewportRect()
        : element
          ? getClientRect(element)
          : null
      setTargetInfo({
        element: element ?? null,
        rect,
        isScreen,
        status: rect && status === 'ready' ? 'ready' : 'resolving',
        stepId: activeStep.id,
        lastUpdated: Date.now(),
      })
    }

    const startObservers = () => {
      if (cancelled) return

      if (isScreen) {
        const onResize = () => commitInfo('ready')
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onResize, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onResize)
          window.removeEventListener('scroll', onResize, true)
        })
      } else if (element) {
        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(() => commitInfo('ready'))
          resizeObserver.observe(element)
        }
        const onReposition = () => commitInfo('ready')
        window.addEventListener('resize', onReposition)
        window.addEventListener('scroll', onReposition, true)
        cleanupFns.push(() => {
          window.removeEventListener('resize', onReposition)
          window.removeEventListener('scroll', onReposition, true)
        })
      }

      commitInfo('ready')
    }

    const tryResolve = () => {
      element = resolveStepTarget(activeStep.target)
      if (isScreen || element) {
        startObservers()
        return true
      }
      commitInfo('resolving')
      return false
    }

    const resolved = tryResolve()
    if (!resolved) {
      const pollInterval = 200
      const timeout = activeStep.waitFor?.timeout ?? 8000
      const startedAt = Date.now()
      pollId = window.setInterval(() => {
        if (tryResolve()) {
          if (pollId) {
            window.clearInterval(pollId)
            pollId = null
          }
          return
        }
        if (timeout > 0 && Date.now() - startedAt >= timeout) {
          if (pollId) {
            window.clearInterval(pollId)
            pollId = null
          }
        }
      }, pollInterval)
    }

    return () => {
      cancelled = true
      if (pollId) window.clearInterval(pollId)
      resizeObserver?.disconnect()
      cleanupFns.forEach((dispose) => dispose())
    }
  }, [activeStep, state])

  useEffect(() => {
    if (!isBrowser) return
    if (!activeStep) return
    if (targetInfo.status !== 'ready') return
    if (targetInfo.isScreen) return
    if (!targetInfo.element || !targetInfo.rect) return
    if (lastAutoScrollIdRef.current === activeStep.id) return

    lastAutoScrollIdRef.current = activeStep.id

    if (!isRectInViewport(targetInfo.rect, 32)) {
      targetInfo.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [activeStep, targetInfo])

  return targetInfo
}
