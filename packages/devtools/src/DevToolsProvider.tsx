'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { GrabberOverlay } from './components/GrabberOverlay'
import { StepList } from './components/StepList'
import { useGrabMode } from './hooks/useGrabMode'
import { useStepStore } from './hooks/useStepStore'

export interface DevToolsProviderProps {
  children: ReactNode
  enabled?: boolean
}

export function DevToolsProvider(props: DevToolsProviderProps) {
  const { children, enabled = true } = props

  // SSR safety - only render client-side components after mount
  const [mounted, setMounted] = useState(false)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

  useEffect(() => {
    setMounted(true)

    // Create shadow DOM host
    const host = document.createElement('div')
    host.setAttribute('data-devtools-host', '')
    host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 99999; pointer-events: none;'
    document.body.appendChild(host)

    const shadow = host.attachShadow({ mode: 'open' })

    // Reset styles in shadow root
    const style = document.createElement('style')
    style.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
    `
    shadow.appendChild(style)

    // Container for React content
    const container = document.createElement('div')
    container.style.cssText = 'pointer-events: auto;'
    shadow.appendChild(container)

    setShadowRoot(shadow)

    return () => {
      document.body.removeChild(host)
    }
  }, [])

  const { mode, hoveredElement, toggleGrabbing, selectCurrent } = useGrabMode()

  const {
    steps,
    addStep,
    removeStep,
    reorderSteps,
    clearAllSteps,
    exportSteps,
  } = useStepStore()

  // Handle click to select element
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'grabbing') return

      // Check if clicking on devtools panel (including shadow DOM)
      const target = e.target as Element
      if (target.closest('[data-devtools-panel]')) return
      if (target.closest('[data-devtools-host]')) return

      // Check if inside shadow DOM belonging to devtools
      const root = target.getRootNode()
      if (root instanceof ShadowRoot) {
        const host = root.host
        if (host?.hasAttribute('data-devtools-host')) return
      }

      e.preventDefault()
      e.stopPropagation()

      const info = selectCurrent()
      if (info) {
        addStep({ info })
      }
    },
    [mode, selectCurrent, addStep]
  )

  // Click handler
  useEffect(() => {
    if (mode !== 'grabbing') return

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [mode, handleClick])

  // Prevent default behaviors during grab mode
  useEffect(() => {
    if (mode !== 'grabbing') return

    const preventDefault = (e: Event) => {
      const target = e.target as Element
      if (target.closest('[data-devtools-panel]')) return
      e.preventDefault()
    }

    document.addEventListener('submit', preventDefault, { capture: true })

    return () => {
      document.removeEventListener('submit', preventDefault, { capture: true })
    }
  }, [mode])

  // Don't render devtools if disabled or not mounted (SSR)
  if (!enabled || !mounted) {
    return <>{children}</>
  }

  // Get the container element inside the shadow root
  const shadowContainer = shadowRoot?.lastElementChild ?? null

  return (
    <>
      {children}
      <GrabberOverlay
        isGrabbing={mode === 'grabbing'}
        hoveredInfo={hoveredElement?.info ?? null}
        container={shadowContainer}
      />
      <StepList
        steps={steps}
        mode={mode}
        onToggleGrab={toggleGrabbing}
        onDeleteStep={removeStep}
        onReorderSteps={reorderSteps}
        onClearAll={clearAllSteps}
        onExport={exportSteps}
        container={shadowContainer}
      />
    </>
  )
}
