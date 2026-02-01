'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'motion/react'
import type { DevToolsExport, GrabbedStep, GrabMode } from '../types'
import { SortableStepItem, StepItemDragPreview } from './StepItem'
import { Toolbar } from './Toolbar'

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
  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    backgroundColor: 'hsl(217 91% 55% / 0.2)',
    color: 'hsl(217 91% 70%)',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 9,
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
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: 10,
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '32px 16px',
    textAlign: 'center' as const,
    color: 'hsl(215 20% 55%)',
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'hsl(215 20% 18%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 1.5,
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 5px',
    backgroundColor: 'hsl(215 20% 15%)',
    border: '1px solid hsl(215 20% 22%)',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'ui-monospace, monospace',
    color: 'hsl(215 20% 55%)',
  },
} as const

export interface StepListProps {
  steps: GrabbedStep[]
  mode: GrabMode
  onToggleGrab: () => void
  onDeleteStep: (params: { id: string }) => void
  onReorderSteps: (params: { fromIndex: number; toIndex: number }) => void
  onClearAll: () => void
  onExport: () => DevToolsExport
  container?: Element | DocumentFragment | null
}

export function StepList(props: StepListProps) {
  const {
    steps,
    mode,
    onToggleGrab,
    onDeleteStep,
    onReorderSteps,
    onClearAll,
    onExport,
    container,
  } = props

  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isPanelDragging, setIsPanelDragging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragStartRef = useRef<{
    x: number
    y: number
    posX: number
    posY: number
  } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeStep = activeId ? steps.find((s) => s.id === activeId) : null
  const activeIndex = activeId ? steps.findIndex((s) => s.id === activeId) : -1

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (over && active.id !== over.id) {
        const oldIndex = steps.findIndex((s) => s.id === active.id)
        const newIndex = steps.findIndex((s) => s.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          onReorderSteps({ fromIndex: oldIndex, toIndex: newIndex })
        }
      }
    },
    [steps, onReorderSteps]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
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

  const handleExportClick = useCallback(() => {
    const data = onExport()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowsterix-steps-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [onExport])

  const handleCopyForAI = useCallback(async () => {
    const data = onExport()
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
  }, [onExport])

  const handleReset = useCallback(() => {
    if (confirm('Clear all steps? This cannot be undone.')) {
      onClearAll()
    }
  }, [onClearAll])

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

  if (typeof window === 'undefined') return null

  const panelStyle: CSSProperties = {
    ...styles.panel,
    right: position.x,
    top: position.y,
  }

  const headerStyle: CSSProperties = {
    ...styles.header,
    ...(isPanelDragging && styles.headerDragging),
  }

  const portalContainer = container ?? document.body

  return createPortal(
    <motion.div
      ref={panelRef}
      style={panelStyle}
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
          {steps.length > 0 && <span style={styles.badge}>{steps.length}</span>}
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

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            style={styles.body}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Toolbar
              mode={mode}
              stepCount={steps.length}
              onToggleGrab={onToggleGrab}
              onExport={handleExportClick}
              onCopyForAI={handleCopyForAI}
              onReset={handleReset}
            />

            <div style={styles.scrollArea}>
              {steps.length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      fill="hsl(215 20% 45%)"
                    >
                      <path d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12zM5.904 10.803L10 6.707v2.768a.5.5 0 0 0 1 0V5.5a.5.5 0 0 0-.5-.5H6.525a.5.5 0 1 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 .707.707z" />
                    </svg>
                  </div>
                  <div style={styles.emptyText}>
                    <div>No steps captured yet.</div>
                    <div style={{ marginTop: 6 }}>
                      Press <span style={styles.kbd}>Ctrl+Shift+G</span> to grab
                    </div>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext
                    items={steps.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={styles.stepList}>
                      {steps.map((step, index) => (
                        <SortableStepItem
                          key={step.id}
                          step={step}
                          index={index}
                          onDelete={() => onDeleteStep({ id: step.id })}
                          isDragActive={activeId !== null}
                          isBeingDragged={step.id === activeId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeStep && (
                      <StepItemDragPreview step={activeStep} index={activeIndex} />
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    portalContainer
  )
}
