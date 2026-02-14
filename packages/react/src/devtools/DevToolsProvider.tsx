'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { springs } from './motion'

import { GrabberOverlay } from './components/GrabberOverlay'
import { StepList } from './components/StepList'
import { TabNav } from './components/TabNav'
import { FlowsTab } from './components/FlowsTab'
import { useGrabMode } from './hooks/useGrabMode'
import { useStepStore } from './hooks/useStepStore'
import { useFlowsData } from './hooks/useFlowsData'
import type { DevToolsTab } from './types'

const styles = {
  panel: {
    position: 'fixed' as const,
    width: 320,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 99998,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13,
    backgroundColor: 'hsl(222 47% 11%)',
    borderRadius: 12,
    border: '1px solid hsl(215 20% 25%)',
    boxShadow:
      '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid hsl(215 20% 20%)',
    backgroundColor: 'hsl(222 47% 9%)',
    cursor: 'grab',
    userSelect: 'none' as const,
    touchAction: 'none' as const,
  },
  headerDragging: {
    cursor: 'grabbing',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'hsl(217 91% 55% / 0.2)',
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'hsl(215 20% 75%)',
    letterSpacing: '-0.01em',
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsl(215 20% 55%)',
    cursor: 'pointer',
    padding: 0,
    borderRadius: 6,
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
} as const

export interface DevToolsProviderProps {
  children: ReactNode
  enabled?: boolean
  defaultTab?: DevToolsTab
}

export function DevToolsProvider(props: DevToolsProviderProps) {
  const { children, enabled = true, defaultTab = 'steps' } = props

  // SSR safety - only render client-side components after mount
  const [mounted, setMounted] = useState(false)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
  const [activeTab, setActiveTab] = useState<DevToolsTab>(defaultTab)

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
    updateStep,
    reorderSteps,
    clearAllSteps,
    exportSteps,
  } = useStepStore()

  const { flows } = useFlowsData()

  // Panel position and collapse state
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isPanelDragging, setIsPanelDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Pointer-based drag for panel movement
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button')) return

      e.preventDefault()
      setIsPanelDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [position]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current || !isPanelDragging) return

      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y

      const newX = Math.max(8, dragStartRef.current.posX - dx)
      const newY = Math.max(8, dragStartRef.current.posY + dy)

      setPosition({ x: newX, y: newY })
    },
    [isPanelDragging]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsPanelDragging(false)
    dragStartRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  // Don't render devtools if disabled or not mounted (SSR)
  if (!enabled || !mounted) {
    return <>{children}</>
  }

  // Get the container element inside the shadow root
  const shadowContainer = shadowRoot?.lastElementChild ?? null

  const panelStyle = {
    ...styles.panel,
    right: position.x,
    top: position.y,
  }

  const headerStyle = {
    ...styles.header,
    ...(isPanelDragging && styles.headerDragging),
    ...(collapsed && { borderBottom: 'none' }),
  }

  const portalContainer = shadowContainer ?? document.body

  return (
    <>
      {children}
      <GrabberOverlay
        isGrabbing={mode === 'grabbing'}
        hoveredInfo={hoveredElement?.info ?? null}
        container={shadowContainer}
      />
      {createPortal(
        <motion.div
          style={panelStyle}
          layoutRoot
          layout="size"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          data-devtools-panel=""
        >
          <div
            style={headerStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div style={styles.titleGroup}>
              <div style={styles.logo}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="hsl(217 91% 70%)">
                  <path d="M8 0L14.9 4v8L8 16 1.1 12V4L8 0zm0 2.3L3.1 5.2v5.6L8 13.7l4.9-2.9V5.2L8 2.3z" />
                  <path d="M8 5l3 1.7v3.4L8 11.8 5 10.1V6.7L8 5z" />
                </svg>
              </div>
              <span style={styles.title}>DevTools</span>
            </div>
            <div style={styles.headerButtons}>
              <button
                type="button"
                style={styles.iconButton}
                onClick={() => setCollapsed(!collapsed)}
                title={
                  collapsed ? 'Expand (Ctrl+Shift+M)' : 'Collapse (Ctrl+Shift+M)'
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{
                    transform: collapsed ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
                </svg>
              </button>
            </div>
          </div>

          <motion.div
            style={{
              ...styles.body,
              overflow: 'hidden',
              flex: collapsed ? '0 0 auto' : '1 1 auto',
            }}
            initial={false}
            animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
            transition={{
              height: springs.smooth,
              opacity: { duration: 0.12 },
            }}
            aria-hidden={collapsed}
          >
            <div style={{ pointerEvents: collapsed ? 'none' : 'auto' }}>
              <TabNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                stepCount={steps.length}
                flowCount={flows.length}
              />

              {activeTab === 'steps' ? (
                <StepList
                  steps={steps}
                  mode={mode}
                  onToggleGrab={toggleGrabbing}
                  onDeleteStep={removeStep}
                  onUpdateStep={updateStep}
                  onReorderSteps={reorderSteps}
                  onClearAll={clearAllSteps}
                  onExport={exportSteps}
                />
              ) : (
                <FlowsTab container={shadowContainer} />
              )}
            </div>
          </motion.div>
        </motion.div>,
        portalContainer
      )}
    </>
  )
}
