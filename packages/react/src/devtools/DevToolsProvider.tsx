'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { springs, useReducedMotion } from './motion'

import { GrabberOverlay } from './components/GrabberOverlay'
import { StepList } from './components/StepList'
import { TabNav } from './components/TabNav'
import { FlowsTab } from './components/FlowsTab'
import { useGrabMode } from './hooks/useGrabMode'
import { useStepStore } from './hooks/useStepStore'
import { useFlowsData } from './hooks/useFlowsData'
import type { DevToolsTab } from './types'
import { devtoolsTheme } from './theme'

const PANEL_WIDTH = 336
const PANEL_HEIGHT = 560
const BUBBLE_SIZE = 52

const styles = {
  shell: {
    position: 'fixed' as const,
    zIndex: 99998,
  },
  surface: {
    position: 'relative' as const,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13,
    background:
      `radial-gradient(circle at 20% 0%, ${devtoolsTheme.primarySoft} 0%, transparent 35%), ${devtoolsTheme.bgPanel}`,
    border: `1px solid ${devtoolsTheme.border}`,
    borderRadius: 18,
    boxShadow: devtoolsTheme.shadowPanel,
    overflow: 'hidden' as const,
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    willChange: 'width, height, border-radius',
  },
  header: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 12px',
    borderBottom: `1px solid ${devtoolsTheme.borderSoft}`,
    backgroundColor: devtoolsTheme.bgPanelAlt,
    cursor: 'grab',
    userSelect: 'none' as const,
    touchAction: 'none' as const,
    minHeight: 52,
  },
  headerCollapsed: {
    borderBottom: '1px solid transparent',
    backgroundColor: devtoolsTheme.bgPanel,
    cursor: 'default',
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
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: devtoolsTheme.bgPanelInset,
    border: `1px solid ${devtoolsTheme.border}`,
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: devtoolsTheme.textSecondary,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const,
  },
  iconButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    zIndex: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    borderRadius: 8,
    color: devtoolsTheme.primary,
    outline: 'none',
  },
  iconStack: {
    position: 'relative' as const,
    width: 26,
    height: 26,
  },
  iconLayer: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
} as const

function DevToolsGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={devtoolsTheme.primary}>
      <path d="M8 0L14.9 4v8L8 16 1.1 12V4L8 0zm0 2.3L3.1 5.2v5.6L8 13.7l4.9-2.9V5.2L8 2.3z" />
      <path d="M8 5l3 1.7v3.4L8 11.8 5 10.1V6.7L8 5z" />
    </svg>
  )
}

export interface DevToolsProviderProps {
  children: ReactNode
  enabled?: boolean
  defaultTab?: DevToolsTab
}

export function DevToolsProvider(props: DevToolsProviderProps) {
  const { children, enabled = true, defaultTab = 'steps' } = props

  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
  const [activeTab, setActiveTab] = useState<DevToolsTab>(defaultTab)

  useEffect(() => {
    setMounted(true)

    const host = document.createElement('div')
    host.setAttribute('data-devtools-host', '')
    host.style.cssText =
      'position: fixed; top: 0; left: 0; z-index: 99999; pointer-events: none;'
    document.body.appendChild(host)

    const shadow = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
    `
    shadow.appendChild(style)

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

  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isPanelDragging, setIsPanelDragging] = useState(false)

  const dragStartRef = useRef<{
    x: number
    y: number
    posX: number
    posY: number
  } | null>(null)

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'grabbing') return

      const target = e.target as Element
      if (target.closest('[data-devtools-panel]')) return
      if (target.closest('[data-devtools-host]')) return

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
    [mode, selectCurrent, addStep],
  )

  useEffect(() => {
    if (mode !== 'grabbing') return

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [mode, handleClick])

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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (collapsed) return

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
    [collapsed, position],
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
    [isPanelDragging],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsPanelDragging(false)
    dragStartRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  if (!enabled || !mounted) {
    return <>{children}</>
  }

  const shadowContainer = shadowRoot?.lastElementChild ?? null

  const shellStyle = {
    ...styles.shell,
    right: position.x,
    top: position.y,
  }

  const headerStyle = {
    ...styles.header,
    ...(collapsed && styles.headerCollapsed),
    ...(isPanelDragging && !collapsed && styles.headerDragging),
  }

  const bodyStyle = {
    ...styles.body,
    pointerEvents: collapsed ? ('none' as const) : ('auto' as const),
  }

  const surfaceTransition = reducedMotion
    ? { duration: 0 }
    : ({
        type: 'spring',
        stiffness: 360,
        damping: 35,
        mass: 0.8,
      } as const)

  const surfaceAnimation = collapsed
    ? {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.34)',
        borderColor: devtoolsTheme.borderStrong,
      }
    : {
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        borderRadius: 18,
        boxShadow: devtoolsTheme.shadowPanel,
        borderColor: devtoolsTheme.border,
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
        <div style={shellStyle} data-devtools-panel="">
          <motion.div
            style={styles.surface}
            initial={false}
            animate={surfaceAnimation}
            transition={surfaceTransition}
          >
            <div
              style={headerStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <motion.div
                style={styles.titleGroup}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: collapsed ? 0 : 1,
                        x: collapsed ? -8 : 0,
                        filter: collapsed ? 'blur(3px)' : 'blur(0px)',
                      }
                }
                transition={reducedMotion ? { duration: 0 } : springs.smooth}
              >
                <div style={styles.logo}>
                  <DevToolsGlyph />
                </div>
                <span style={styles.title}>Flowsterix DevTools</span>
              </motion.div>

              <motion.button
                type="button"
                style={styles.iconButton}
                title={
                  collapsed ? 'Open DevTools (Ctrl+Shift+M)' : 'Collapse to bubble (Ctrl+Shift+M)'
                }
                onClick={() => setCollapsed((v) => !v)}
                whileHover={reducedMotion ? {} : { scale: 1.03 }}
                whileTap={reducedMotion ? {} : { scale: 0.97 }}
              >
                <span style={styles.iconStack}>
                  <motion.span
                    style={styles.iconLayer}
                    animate={
                      reducedMotion
                        ? {}
                        : {
                            opacity: collapsed ? 1 : 0,
                            filter: collapsed ? 'blur(0px)' : 'blur(4px)',
                            scale: collapsed ? 1 : 0.92,
                          }
                    }
                    transition={reducedMotion ? { duration: 0 } : springs.smooth}
                  >
                    <span style={styles.logo}>
                      <DevToolsGlyph />
                    </span>
                  </motion.span>
                  <motion.span
                    style={styles.iconLayer}
                    animate={
                      reducedMotion
                        ? {}
                        : {
                            opacity: collapsed ? 0 : 1,
                            filter: collapsed ? 'blur(4px)' : 'blur(0px)',
                            scale: collapsed ? 0.92 : 1,
                          }
                    }
                    transition={reducedMotion ? { duration: 0 } : springs.smooth}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 8a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8z" />
                    </svg>
                  </motion.span>
                </span>
              </motion.button>
            </div>

            <motion.div
              style={bodyStyle}
              animate={
                reducedMotion
                  ? {}
                  : {
                      opacity: collapsed ? 0 : 1,
                      y: collapsed ? 8 : 0,
                      filter: collapsed ? 'blur(2px)' : 'blur(0px)',
                    }
              }
              transition={reducedMotion ? { duration: 0 } : springs.smooth}
            >
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
                  overlayContainer={shadowContainer}
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
            </motion.div>
          </motion.div>
        </div>,
        portalContainer,
      )}
    </>
  )
}
