import { useEffect, useRef } from 'react'

import type { TourTargetInfo } from '../hooks/useTourTarget'
import { isBrowser } from '../utils/dom'
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

interface TourFocusManagerProps {
  active: boolean
  target: TourTargetInfo
  popoverNode: HTMLElement | null
}

export const TourFocusManager = ({
  active,
  target,
  popoverNode,
}: TourFocusManagerProps) => {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isBrowser) return
    if (!active) {
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      if (previous && previous.isConnected) {
        runMicrotask(() => {
          focusElement(previous, { preventScroll: true })
        })
      }
      return
    }

    if (previousFocusRef.current) return

    const doc = popoverNode?.ownerDocument ?? target.element?.ownerDocument

    const activeEl = (doc ?? document).activeElement
    if (activeEl instanceof HTMLElement) {
      previousFocusRef.current = activeEl
    }
  }, [active, popoverNode, target.element])
  useEffect(() => {
    if (!isBrowser) return
    if (!active) return

    const doc =
      popoverNode?.ownerDocument ?? target.element?.ownerDocument ?? document

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

    let focusables = deriveFocusables()

    const isWithinTrap = (element: Element | null) => {
      if (!(element instanceof HTMLElement)) return false
      return focusables.some(
        (node) => node === element || node.contains(element),
      )
    }

    const ensureFocus = () => {
      focusables = deriveFocusables()
      if (focusables.length === 0) return
      focusElement(focusables[0])
    }

    if (!isWithinTrap(doc.activeElement)) {
      runMicrotask(ensureFocus)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      focusables = deriveFocusables()
      if (focusables.length === 0) return

      const current =
        doc.activeElement instanceof HTMLElement ? doc.activeElement : null
      const index = current
        ? focusables.findIndex(
            (node) => node === current || node.contains(current),
          )
        : -1

      event.preventDefault()

      if (event.shiftKey) {
        const previousIndex = index <= 0 ? focusables.length - 1 : index - 1
        focusElement(focusables[previousIndex])
        return
      }

      const nextIndex =
        index === -1 || index >= focusables.length - 1 ? 0 : index + 1
      focusElement(focusables[nextIndex])
    }

    const handleFocusIn = (event: FocusEvent) => {
      const targetNode = event.target
      focusables = deriveFocusables()
      if (!(targetNode instanceof HTMLElement)) return
      if (isWithinTrap(targetNode)) return
      ensureFocus()
    }

    doc.addEventListener('keydown', handleKeyDown, true)
    doc.addEventListener('focusin', handleFocusIn, true)

    const observers: Array<MutationObserver> = []

    const observe = (root: Element | null) => {
      if (!root) return
      if (typeof MutationObserver !== 'function') return
      const observer = new MutationObserver(() => {
        focusables = deriveFocusables()
      })
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
      })
      observers.push(observer)
    }

    observe(popoverNode)
    const targetIsFocusable =
      !target.isScreen &&
      target.visibility === 'visible' &&
      target.element instanceof HTMLElement

    if (targetIsFocusable) {
      observe(target.element)
    }

    return () => {
      doc.removeEventListener('keydown', handleKeyDown, true)
      doc.removeEventListener('focusin', handleFocusIn, true)
      observers.forEach((observer) => observer.disconnect())
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

  return null
}
