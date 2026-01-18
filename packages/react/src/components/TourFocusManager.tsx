import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { TourOverlayRect } from '../hooks/useTourOverlay'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { isBrowser, portalHost } from '../utils/dom'
import {
  focusElement,
  getFocusableIn,
  isFocusableElement,
} from '../utils/focus'

const runMicrotask = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
  } else {
    setTimeout(callback, 0)
  }
}

export interface TourFocusManagerProps {
  active: boolean
  target: TourTargetInfo
  popoverNode: HTMLElement | null
  highlightRect?: TourOverlayRect | null
  targetRingOffset?: number
}

export const TourFocusManager = ({
  active,
  target,
  popoverNode,
  highlightRect,
  targetRingOffset = -2,
}: TourFocusManagerProps) => {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const guardNodesRef = useRef<Record<string, HTMLElement | null>>({
    'target-start': null,
    'target-end': null,
    'popover-start': null,
    'popover-end': null,
  })
  const lastTabDirectionRef = useRef<'forward' | 'backward'>('forward')
  const suppressGuardHopRef = useRef<HTMLElement | null>(null)
  const ringStylesRef = useRef(
    new WeakMap<HTMLElement, { outline: string; outlineOffset: string }>(),
  )
  const [targetRingActive, setTargetRingActive] = useState(false)

  const restoreFocus = () => {
    const previous = previousFocusRef.current
    previousFocusRef.current = null
    if (previous && previous.isConnected) {
      runMicrotask(() => {
        focusElement(previous, { preventScroll: true })
      })
    }
  }

  useLayoutEffect(() => {
    if (!isBrowser) return
    if (!active) {
      restoreFocus()
      return
    }

    if (previousFocusRef.current) return

    const doc = popoverNode?.ownerDocument ?? target.element?.ownerDocument

    const activeEl = (doc ?? document).activeElement
    if (activeEl instanceof HTMLElement) {
      previousFocusRef.current = activeEl
    }
    return () => {
      restoreFocus()
    }
  }, [active, popoverNode, target.element])
  useEffect(() => {
    if (!isBrowser) return
    if (!active) return

    const doc =
      popoverNode?.ownerDocument ?? target.element?.ownerDocument ?? document

    const createGuard = (key: string) => {
      const node = doc.createElement('div')
      node.tabIndex = 0
      node.setAttribute('data-tour-focus-guard', key)
      node.setAttribute('data-tour-prevent-shortcut', 'true')
      const label = key.startsWith('target')
        ? 'Tour highlight boundary'
        : 'Tour popover boundary'
      node.setAttribute('aria-label', label)
      Object.assign(node.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '1px',
        height: '1px',
        opacity: '0',
        outline: 'none',
        padding: '0',
        margin: '0',
        border: '0',
        pointerEvents: 'auto',
      })
      return node
    }

    const applyRing = (element: HTMLElement | null, activeRing: boolean) => {
      if (!element) return
      const cache = ringStylesRef.current
      if (activeRing) {
        if (!cache.has(element)) {
          cache.set(element, {
            outline: element.style.outline,
            outlineOffset: element.style.outlineOffset,
          })
        }
        element.style.outline =
          '2px solid var(--tour-focus-ring-color, rgba(59, 130, 246, 0.8))'
        element.style.outlineOffset = '3px'
        return
      }
      const previous = cache.get(element)
      if (previous) {
        element.style.outline = previous.outline
        element.style.outlineOffset = previous.outlineOffset
        cache.delete(element)
      } else {
        element.style.outline = ''
        element.style.outlineOffset = ''
      }
    }

    const clearRings = () => {
      setTargetRingActive(false)
      applyRing(popoverNode, false)
    }

    const removeGuards = () => {
      for (const key of Object.keys(guardNodesRef.current)) {
        const node = guardNodesRef.current[key]
        if (node?.parentNode) {
          node.parentNode.removeChild(node)
        }
        guardNodesRef.current[key] = null
      }
      clearRings()
    }

    const ensureGuards = () => {
      const targetElement =
        !target.isScreen && target.element instanceof HTMLElement
          ? target.element
          : null
      const popoverElement = popoverNode ?? null

      if (targetElement) {
        if (!guardNodesRef.current['target-start']) {
          guardNodesRef.current['target-start'] = createGuard('target-start')
        }
        if (!guardNodesRef.current['target-end']) {
          guardNodesRef.current['target-end'] = createGuard('target-end')
        }
        const startGuard = guardNodesRef.current['target-start']
        const endGuard = guardNodesRef.current['target-end']
        if (startGuard.parentElement !== targetElement.parentElement) {
          targetElement.insertAdjacentElement('beforebegin', startGuard)
        }
        if (endGuard.parentElement !== targetElement.parentElement) {
          targetElement.insertAdjacentElement('afterend', endGuard)
        }
      } else {
        for (const key of ['target-start', 'target-end']) {
          const node = guardNodesRef.current[key]
          if (node?.parentNode) {
            node.parentNode.removeChild(node)
          }
          guardNodesRef.current[key] = null
        }
      }

      if (popoverElement) {
        if (!guardNodesRef.current['popover-start']) {
          guardNodesRef.current['popover-start'] = createGuard('popover-start')
        }
        if (!guardNodesRef.current['popover-end']) {
          guardNodesRef.current['popover-end'] = createGuard('popover-end')
        }
        const startGuard = guardNodesRef.current['popover-start']
        const endGuard = guardNodesRef.current['popover-end']
        if (startGuard.parentElement !== popoverElement) {
          popoverElement.prepend(startGuard)
        }
        if (endGuard.parentElement !== popoverElement) {
          popoverElement.append(endGuard)
        }
      } else {
        for (const key of ['popover-start', 'popover-end']) {
          const node = guardNodesRef.current[key]
          if (node?.parentNode) {
            node.parentNode.removeChild(node)
          }
          guardNodesRef.current[key] = null
        }
      }
    }

    const deriveFocusables = () => {
      const nodes: Array<HTMLElement> = []
      if (popoverNode) {
        nodes.push(...getFocusableIn(popoverNode))
      }
      const targetIsFocusable =
        !target.isScreen &&
        target.visibility === 'visible' &&
        target.element instanceof HTMLElement

      if (targetIsFocusable) {
        const targetElement = target.element as HTMLElement
        if (
          !targetElement.closest('[data-tour-focus-skip="true"]') &&
          isFocusableElement(targetElement)
        ) {
          nodes.push(targetElement)
        }
        nodes.push(...getFocusableIn(targetElement))
      }
      if (nodes.length === 0 && popoverNode?.hasAttribute('tabindex')) {
        nodes.push(popoverNode)
      }

      const unique: Array<HTMLElement> = []
      const seen = new Set<HTMLElement>()
      for (const node of nodes) {
        if (seen.has(node)) continue
        seen.add(node)
        unique.push(node)
      }
      return unique
    }

    const isWithinTrap = (element: Element | null) => {
      if (!(element instanceof HTMLElement)) return false
      if (popoverNode?.contains(element)) return true
      if (
        target.element instanceof HTMLElement &&
        target.element.contains(element)
      ) {
        return true
      }
      return Object.values(guardNodesRef.current).some(
        (node) => node === element,
      )
    }

    const ensureFocus = () => {
      const firstGuard =
        guardNodesRef.current['target-start'] ??
        guardNodesRef.current['popover-start']
      if (firstGuard) {
        focusElement(firstGuard)
        return
      }
      const focusables = deriveFocusables()
      if (focusables.length === 0) return
      focusElement(focusables[0])
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      lastTabDirectionRef.current = event.shiftKey ? 'backward' : 'forward'
    }

    const handleFocusIn = (event: FocusEvent) => {
      const targetNode = event.target
      if (!(targetNode instanceof HTMLElement)) return
      if (targetNode.hasAttribute('data-tour-focus-guard')) {
        if (suppressGuardHopRef.current === targetNode) {
          suppressGuardHopRef.current = null
        } else {
          const direction = lastTabDirectionRef.current
          const key = targetNode.getAttribute('data-tour-focus-guard')
          const targetStart = guardNodesRef.current['target-start']
          const targetEnd = guardNodesRef.current['target-end']
          const popoverStart = guardNodesRef.current['popover-start']
          const popoverEnd = guardNodesRef.current['popover-end']

          const nextGuard =
            direction === 'forward'
              ? key === 'target-end'
                ? popoverStart
                : key === 'popover-end'
                  ? targetStart
                  : null
              : key === 'popover-start'
                ? targetEnd
                : key === 'target-start'
                  ? popoverEnd
                  : null

          if (nextGuard) {
            suppressGuardHopRef.current = nextGuard
            focusElement(nextGuard)
            return
          }
        }

        const key = targetNode.getAttribute('data-tour-focus-guard')
        if (key?.startsWith('target')) {
          setTargetRingActive(true)
          applyRing(popoverNode, false)
        } else if (key?.startsWith('popover')) {
          setTargetRingActive(false)
          applyRing(popoverNode, true)
        }
        return
      }
      clearRings()
      if (isWithinTrap(targetNode)) return
      ensureFocus()
    }

    ensureGuards()

    doc.addEventListener('keydown', handleKeyDown, true)
    doc.addEventListener('focusin', handleFocusIn, true)

    return () => {
      doc.removeEventListener('keydown', handleKeyDown, true)
      doc.removeEventListener('focusin', handleFocusIn, true)
      removeGuards()
    }
  }, [
    active,
    popoverNode,
    target.element,
    target.isScreen,
    target.lastUpdated,
    target.status,
    target.stepId,
    target.visibility,
  ])

  if (!isBrowser) return null
  const host = portalHost()
  if (!host || !highlightRect || !targetRingActive) return null

  const offset = Math.max(0, targetRingOffset)
  const ringStyle = {
    position: 'fixed' as const,
    top: highlightRect.top - offset,
    left: highlightRect.left - offset,
    width: highlightRect.width + offset * 2,
    height: highlightRect.height + offset * 2,
    borderRadius: highlightRect.radius + offset,
    boxShadow: [
      '0 0 0 2px var(--tour-focus-ring-offset-color, transparent)',
      '0 0 0 2px var(--tour-focus-ring-color, rgba(59, 130, 246, 0.8))',
    ].join(', '),
    pointerEvents: 'none' as const,
    zIndex: 2001,
  }

  return createPortal(<div style={ringStyle} aria-hidden />, host)
}
