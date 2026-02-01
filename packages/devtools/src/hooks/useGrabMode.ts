import { useCallback, useEffect, useState } from 'react'
import type { ElementInfo, GrabMode } from '../types'
import { useElementInfo } from './useElementInfo'

interface HoveredElementState {
  element: Element
  info: ElementInfo
}

export interface UseGrabModeResult {
  mode: GrabMode
  hoveredElement: HoveredElementState | null
  startGrabbing: () => void
  stopGrabbing: () => void
  toggleGrabbing: () => void
  selectCurrent: () => ElementInfo | null
}

function isDevToolsElement(element: Element): boolean {
  // Check if inside devtools panel (for non-shadow DOM case)
  if (element.closest('[data-devtools-panel]')) return true

  // Check if inside shadow DOM host
  if (element.closest('[data-devtools-host]')) return true

  // Check if the element's root is a shadow root belonging to devtools
  const root = element.getRootNode()
  if (root instanceof ShadowRoot) {
    const host = root.host
    if (host?.hasAttribute('data-devtools-host')) return true
  }

  return false
}

export function useGrabMode(): UseGrabModeResult {
  const [mode, setMode] = useState<GrabMode>('idle')
  const [hoveredElement, setHoveredElement] = useState<HoveredElementState | null>(null)
  const { getElementInfo } = useElementInfo()

  const startGrabbing = useCallback(() => {
    setMode('grabbing')
    setHoveredElement(null)
  }, [])

  const stopGrabbing = useCallback(() => {
    setMode('idle')
    setHoveredElement(null)
  }, [])

  const toggleGrabbing = useCallback(() => {
    setMode((prev) => (prev === 'grabbing' ? 'idle' : 'grabbing'))
    setHoveredElement(null)
  }, [])

  const selectCurrent = useCallback((): ElementInfo | null => {
    if (!hoveredElement) return null
    return hoveredElement.info
  }, [hoveredElement])

  // Mouse move handler
  useEffect(() => {
    if (mode !== 'grabbing') return

    const handleMouseMove = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) {
        setHoveredElement(null)
        return
      }

      // Skip devtools panel itself
      if (isDevToolsElement(target)) {
        setHoveredElement(null)
        return
      }

      // Skip html/body
      if (target.tagName === 'HTML' || target.tagName === 'BODY') {
        setHoveredElement(null)
        return
      }

      setHoveredElement({
        element: target,
        info: getElementInfo({ element: target }),
      })
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [mode, getElementInfo])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+G to toggle grab mode
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        toggleGrabbing()
        return
      }

      if (mode !== 'grabbing') return

      // ESC to cancel
      if (e.key === 'Escape') {
        e.preventDefault()
        stopGrabbing()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mode, toggleGrabbing, stopGrabbing])

  return {
    mode,
    hoveredElement,
    startGrabbing,
    stopGrabbing,
    toggleGrabbing,
    selectCurrent,
  }
}
