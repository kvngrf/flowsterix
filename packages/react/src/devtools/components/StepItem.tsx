'use client'

import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { GrabbedStep } from '../types'
import { formatSourcePath, getVSCodeLink } from '../utils/sourceExtractor'

const styles = {
  card: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    backgroundColor: 'hsl(215 20% 16%)',
    borderRadius: 8,
    border: '1px solid hsl(215 20% 22%)',
    fontSize: 12,
    fontFamily: 'inherit',
    overflow: 'hidden' as const,
  },
  cardGhost: {
    opacity: 0.4,
    border: '1px dashed hsl(217 91% 60%)',
    backgroundColor: 'hsl(217 91% 60% / 0.05)',
  },
  cardOverlay: {
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
    border: '1px solid hsl(217 91% 60%)',
  },
  dragHandle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    cursor: 'grab',
    color: 'hsl(215 20% 40%)',
    flexShrink: 0,
    backgroundColor: 'hsl(215 20% 13%)',
    borderRight: '1px solid hsl(215 20% 20%)',
    transition: 'color 0.15s ease, background-color 0.15s ease',
  },
  dragHandleActive: {
    cursor: 'grabbing',
    backgroundColor: 'hsl(217 91% 60% / 0.15)',
    color: 'hsl(217 91% 60%)',
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: 10,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  order: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    backgroundColor: 'hsl(217 91% 55% / 0.2)',
    color: 'hsl(217 91% 70%)',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 5,
    flexShrink: 0,
  },
  tagBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    backgroundColor: 'hsl(215 20% 22%)',
    color: 'hsl(217 91% 70%)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    fontWeight: 500,
    borderRadius: 4,
  },
  text: {
    color: 'hsl(215 20% 65%)',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: 140,
    fontSize: 11,
  },
  selector: {
    display: 'block',
    color: 'hsl(265 83% 75%)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    padding: '4px 6px',
    backgroundColor: 'hsl(215 20% 12%)',
    borderRadius: 4,
    border: '1px solid hsl(215 20% 18%)',
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: 'hsl(142 71% 55%)',
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    textDecoration: 'none',
    padding: '2px 0',
    transition: 'color 0.15s ease',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsl(215 20% 50%)',
    cursor: 'pointer',
    padding: 0,
    borderRadius: 4,
    transition: 'color 0.15s ease, background-color 0.15s ease',
    outline: 'none',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsl(215 20% 45%)',
    cursor: 'pointer',
    padding: 0,
    borderRadius: 5,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
    transition: 'color 0.15s ease, background-color 0.15s ease',
    outline: 'none',
  },
} as const

export interface StepItemProps {
  step: GrabbedStep
  index: number
  onDelete: () => void
  isDragActive?: boolean
  isBeingDragged?: boolean
}

export function SortableStepItem(props: StepItemProps) {
  const { step, index, onDelete, isBeingDragged = false } = props

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const handleCopySource = async () => {
    if (step.source) {
      const path = formatSourcePath({ source: step.source })
      await navigator.clipboard.writeText(path)
    }
  }

  // Show ghost placeholder when this item is being dragged
  const isGhost = isDragging || isBeingDragged

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  }

  const cardStyle: CSSProperties = {
    ...styles.card,
    ...(isGhost && styles.cardGhost),
  }

  const handleStyle: CSSProperties = {
    ...styles.dragHandle,
  }

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <div style={cardStyle}>
        <div style={handleStyle} {...attributes} {...listeners}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="3" cy="2" r="1.5" />
            <circle cx="7" cy="2" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="7" cy="8" r="1.5" />
            <circle cx="3" cy="14" r="1.5" />
            <circle cx="7" cy="14" r="1.5" />
          </svg>
        </div>

        <div style={styles.content}>
          <div style={styles.header}>
            <span style={styles.order}>{index + 1}</span>
            <span style={styles.tagBadge}>&lt;{step.elementTag}&gt;</span>
            {step.elementText && (
              <span style={styles.text}>{step.elementText}</span>
            )}
          </div>

          <div style={styles.selector}>{step.selector}</div>

          {step.source && (
            <div style={styles.sourceRow}>
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="hsl(142 71% 55%)"
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <a
                href={getVSCodeLink({ source: step.source })}
                style={styles.sourceLink}
                title="Open in VS Code"
              >
                {formatSourcePath({ source: step.source })}
              </a>
              <button
                type="button"
                style={styles.copyButton}
                onClick={handleCopySource}
                title="Copy path"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M10 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 1h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" />
                  <path d="M14 5a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a1 1 0 0 1 0-2h7V6a1 1 0 0 1 1-1z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          style={styles.deleteButton}
          onClick={onDelete}
          title="Delete step"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Drag overlay preview - this is what you see while dragging
export interface StepItemDragPreviewProps {
  step: GrabbedStep
  index: number
}

export function StepItemDragPreview(props: StepItemDragPreviewProps) {
  const { step, index } = props

  const cardStyle: CSSProperties = {
    ...styles.card,
    ...styles.cardOverlay,
    width: 298, // Fixed width for overlay
  }

  const handleStyle: CSSProperties = {
    ...styles.dragHandle,
    ...styles.dragHandleActive,
  }

  return (
    <div style={cardStyle}>
      <div style={handleStyle}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="3" cy="2" r="1.5" />
          <circle cx="7" cy="2" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="7" cy="8" r="1.5" />
          <circle cx="3" cy="14" r="1.5" />
          <circle cx="7" cy="14" r="1.5" />
        </svg>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.order}>{index + 1}</span>
          <span style={styles.tagBadge}>&lt;{step.elementTag}&gt;</span>
          {step.elementText && (
            <span style={styles.text}>{step.elementText}</span>
          )}
        </div>

        <div style={styles.selector}>{step.selector}</div>

        {step.source && (
          <div style={styles.sourceRow}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="hsl(142 71% 55%)"
            >
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
            </svg>
            <span style={styles.sourceLink}>
              {formatSourcePath({ source: step.source })}
            </span>
          </div>
        )}
      </div>

      <div style={{ ...styles.deleteButton, visibility: 'hidden' }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </div>
    </div>
  )
}

// Keep legacy export for compatibility
export { SortableStepItem as StepItem }
