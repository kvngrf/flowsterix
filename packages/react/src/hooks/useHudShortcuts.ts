import { useEffect } from 'react'

import { useTour } from '../context'
import { isBrowser } from '../utils/dom'
import { useTourControls } from './useTourControls'
import type { TourTargetInfo } from './useTourTarget'

export interface UseHudShortcutsOptions {
  enabled?: boolean
  escape?: boolean
}

const isInteractiveElement = (node: Element | null) => {
  if (!node) return false
  if (node.getAttribute('role') === 'button') return true
  if (node.hasAttribute('contenteditable')) return true
  const interactiveSelector =
    'button, a[href], input, textarea, select, summary, [role="button"], [data-tour-prevent-shortcut="true"]'
  return Boolean(node.closest(interactiveSelector))
}

export const useHudShortcuts = (
  target: TourTargetInfo | null,
  options?: UseHudShortcutsOptions,
) => {
  const enabled = options?.enabled ?? true
  const escapeEnabled = options?.escape ?? true
  const { state } = useTour()
  const { cancel, canGoBack, goBack, canGoNext, goNext, isActive } =
    useTourControls()

  useEffect(() => {
    if (!isBrowser) return undefined
    if (!enabled) return undefined
    if (!target) return undefined
    if (!state || state.status !== 'running') return undefined
    if (!isActive) return undefined

    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      if (event.key === 'Escape' && escapeEnabled) {
        cancel('keyboard')
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowLeft') {
        if (canGoBack) {
          goBack()
          event.preventDefault()
        }
        return
      }

      if (event.key === 'ArrowRight') {
        if (canGoNext) {
          goNext()
          event.preventDefault()
        }
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (target.status !== 'ready') return
        if (event.target instanceof Element) {
          if (target.element && target.element.contains(event.target)) {
            return
          }
          if (event.target.closest('[data-tour-popover]')) {
            return
          }
          if (isInteractiveElement(event.target)) {
            return
          }
        }
        if (canGoNext) {
          goNext()
          event.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [
    canGoBack,
    canGoNext,
    cancel,
    enabled,
    goBack,
    goNext,
    isActive,
    state,
    target,
  ])
}
