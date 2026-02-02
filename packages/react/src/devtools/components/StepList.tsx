'use client'

import { useCallback, useState } from 'react'
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
import type { DevToolsExport, GrabbedStep, GrabMode } from '../types'
import { SortableStepItem, StepItemDragPreview } from './StepItem'
import { Toolbar } from './Toolbar'

const styles = {
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
  } = props

  const [activeId, setActiveId] = useState<string | null>(null)

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

  if (typeof window === 'undefined') return null

  return (
    <>
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
    </>
  )
}
