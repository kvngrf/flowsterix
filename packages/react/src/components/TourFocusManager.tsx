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
  guardElementFocusRing?: { boxShadow: string }
}

const DEFAULT_BOX_SHADOW =
  '0 0 0 2px var(--primary), 0 0 8px 2px color-mix(in srgb, var(--primary) 40%, transparent)'

export const TourFocusManager = ({
  active,
  target,
  popoverNode,
  highlightRect,
  guardElementFocusRing,
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
  const [targetRingActive, setTargetRingActive] = useState(false)
  const [popoverRingActive, setPopoverRingActive] = useState(false)
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null)

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

    const clearRings = () => {
      setTargetRingActive(false)
      setPopoverRingActive(false)
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
          const hasTargetGuards = Boolean(targetStart && targetEnd)

          const nextGuard =
            direction === 'forward'
              ? key === 'target-end'
                ? popoverStart
                : key === 'popover-end'
                  ? hasTargetGuards
                    ? targetStart
                    : popoverStart
                  : null
              : key === 'popover-start'
                ? hasTargetGuards
                  ? targetEnd
                  : popoverEnd
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
          setPopoverRingActive(false)
        } else if (key?.startsWith('popover')) {
          setTargetRingActive(false)
          setPopoverRingActive(true)
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

  useLayoutEffect(() => {
    if (popoverRingActive && popoverNode) {
      setPopoverRect(popoverNode.getBoundingClientRect())
    } else {
      setPopoverRect(null)
    }
  }, [popoverRingActive, popoverNode])

  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const boxShadow = guardElementFocusRing?.boxShadow ?? DEFAULT_BOX_SHADOW

  const showTargetRing = targetRingActive && highlightRect
  const showPopoverRing = popoverRingActive && popoverRect

  if (!showTargetRing && !showPopoverRing) return null

  return createPortal(
    <>
      {showTargetRing && (
        <div
          style={{
            position: 'fixed',
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            borderRadius: highlightRect.radius,
            boxShadow,
            pointerEvents: 'none',
            zIndex: 2001,
          }}
          aria-hidden
        />
      )}
      {showPopoverRing && (
        <div
          style={{
            position: 'fixed',
            top: popoverRect.top,
            left: popoverRect.left,
            width: popoverRect.width,
            height: popoverRect.height,
            borderRadius: 12,
            boxShadow,
            pointerEvents: 'none',
            zIndex: 2001,
          }}
          aria-hidden
        />
      )}
    </>,
    host,
  )
}
