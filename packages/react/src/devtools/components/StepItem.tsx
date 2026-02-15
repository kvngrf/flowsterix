'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import type { GrabbedStep } from '../types'
import { formatSourcePath, getVSCodeLink } from '../utils/sourceExtractor'
import { springs, useReducedMotion } from '../motion'
import { devtoolsTheme } from '../theme'

const styles = {
  card: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    backgroundColor: devtoolsTheme.bgPanelAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: devtoolsTheme.border,
    fontSize: 12,
    fontFamily: 'inherit',
    overflow: 'hidden' as const,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  cardHover: {
    borderColor: devtoolsTheme.borderStrong,
    boxShadow: `0 0 0 2px ${devtoolsTheme.primarySoft}, 0 4px 12px rgba(0, 0, 0, 0.22)`,
  },
  cardGhost: {
    opacity: 0.4,
    borderStyle: 'dashed',
    borderColor: devtoolsTheme.primaryStrong,
    backgroundColor: devtoolsTheme.primarySoft,
  },
  cardOverlay: {
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
    borderStyle: 'solid',
    borderColor: devtoolsTheme.primary,
  },
  dragHandle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    cursor: 'grab',
    color: devtoolsTheme.textFaint,
    flexShrink: 0,
    backgroundColor: devtoolsTheme.bgPanelInset,
    borderRight: `1px solid ${devtoolsTheme.borderSoft}`,
    transition: 'color 0.15s ease, background-color 0.15s ease',
  },
  dragHandleActive: {
    cursor: 'grabbing',
    backgroundColor: devtoolsTheme.primarySoft,
    color: devtoolsTheme.primary,
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: 10,
  },
  stepNameInput: {
    width: '100%',
    padding: '4px 6px',
    backgroundColor: devtoolsTheme.bgPanelInsetStrong,
    border: `1px solid ${devtoolsTheme.borderSoft}`,
    borderRadius: 4,
    color: devtoolsTheme.textPrimary,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.3,
    outline: 'none',
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
    backgroundColor: devtoolsTheme.primarySoft,
    color: devtoolsTheme.primary,
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 5,
    flexShrink: 0,
  },
  tagBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    backgroundColor: devtoolsTheme.bgPanelInset,
    color: devtoolsTheme.primary,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    fontWeight: 500,
    borderRadius: 4,
  },
  text: {
    color: devtoolsTheme.textSecondary,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: 140,
    fontSize: 11,
  },
  selector: {
    display: 'block',
    color: devtoolsTheme.mustard,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    padding: '4px 6px',
    backgroundColor: devtoolsTheme.bgPanelInsetStrong,
    borderRadius: 4,
    border: `1px solid ${devtoolsTheme.borderSoft}`,
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    color: devtoolsTheme.mint,
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
  },
  urlText: {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  sourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: devtoolsTheme.mint,
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
    color: devtoolsTheme.textMuted,
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
    color: devtoolsTheme.textFaint,
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

function formatStepUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return path
    }
    return `${parsed.origin}${path}`
  } catch {
    return url
  }
}

export interface StepItemProps {
  step: GrabbedStep
  index: number
  onUpdateName?: (name: string) => void
  onDelete: () => void
  isDragActive?: boolean
  isBeingDragged?: boolean
}

export function SortableStepItem(props: StepItemProps) {
  const { step, index, onUpdateName, onDelete, isBeingDragged = false } = props
  const [isHovered, setIsHovered] = useState(false)
  const [nameDraft, setNameDraft] = useState(step.label ?? `Step ${index + 1}`)
  const reducedMotion = useReducedMotion()

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

  useEffect(() => {
    setNameDraft(step.label ?? `Step ${index + 1}`)
  }, [step.id, step.label, index])

  const commitName = () => {
    const nextName = nameDraft.trim() || `Step ${index + 1}`
    if (nextName !== step.label) {
      onUpdateName?.(nextName)
    }
    if (nextName !== nameDraft) {
      setNameDraft(nextName)
    }
  }

  const isGhost = isDragging || isBeingDragged

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  }

  const cardStyle: CSSProperties = {
    ...styles.card,
    ...(isHovered && !isGhost && styles.cardHover),
    ...(isGhost && styles.cardGhost),
  }

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={cardStyle}>
        <div style={styles.dragHandle} {...attributes} {...listeners}>
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
          <input
            type="text"
            aria-label={`Step ${index + 1} name`}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
                return
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                const fallbackName = step.label ?? `Step ${index + 1}`
                setNameDraft(fallbackName)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder={`Step ${index + 1}`}
            style={styles.stepNameInput}
          />

          <div style={styles.header}>
            <motion.span
              key={`order-${index}`}
              style={styles.order}
              initial={reducedMotion ? {} : { scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={reducedMotion ? { duration: 0 } : springs.bouncy}
            >
              {index + 1}
            </motion.span>
            <span style={styles.tagBadge}>&lt;{step.elementTag}&gt;</span>
            {step.elementText && <span style={styles.text}>{step.elementText}</span>}
          </div>

          <div style={styles.selector}>{step.selector}</div>

          <div style={styles.urlRow} title={step.url}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.354 5.5H9a.5.5 0 0 0 0-1H6.354a2.5 2.5 0 1 0 0 5H9a.5.5 0 0 0 0-1H6.354a1.5 1.5 0 1 1 0-3z" />
              <path d="M7 8.5a.5.5 0 0 0 0-1h2a.5.5 0 0 0 0 1H7z" />
              <path d="M9.646 4.5H7a.5.5 0 0 0 0 1h2.646a1.5 1.5 0 0 1 0 3H7a.5.5 0 0 0 0 1h2.646a2.5 2.5 0 0 0 0-5z" />
            </svg>
            <span style={styles.urlText}>{formatStepUrl(step.url)}</span>
          </div>

          {step.source && (
            <div style={styles.sourceRow}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill={devtoolsTheme.mint}>
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
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 1h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" />
                  <path d="M14 5a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a1 1 0 0 1 0-2h7V6a1 1 0 0 1 1-1z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <motion.button
          type="button"
          style={styles.deleteButton}
          onClick={onDelete}
          title="Delete step"
          whileHover={reducedMotion ? {} : { scale: 1.1, color: devtoolsTheme.accent }}
          whileTap={reducedMotion ? {} : { scale: 0.9 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

export interface StepItemDragPreviewProps {
  step: GrabbedStep
  index: number
}

export function StepItemDragPreview(props: StepItemDragPreviewProps) {
  const { step, index } = props

  const cardStyle: CSSProperties = {
    ...styles.card,
    ...styles.cardOverlay,
    width: 298,
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
        <div style={styles.stepNameInput}>{step.label?.trim() || `Step ${index + 1}`}</div>

        <div style={styles.header}>
          <span style={styles.order}>{index + 1}</span>
          <span style={styles.tagBadge}>&lt;{step.elementTag}&gt;</span>
          {step.elementText && <span style={styles.text}>{step.elementText}</span>}
        </div>

        <div style={styles.selector}>{step.selector}</div>

        <div style={styles.urlRow} title={step.url}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.354 5.5H9a.5.5 0 0 0 0-1H6.354a2.5 2.5 0 1 0 0 5H9a.5.5 0 0 0 0-1H6.354a1.5 1.5 0 1 1 0-3z" />
            <path d="M7 8.5a.5.5 0 0 0 0-1h2a.5.5 0 0 0 0 1H7z" />
            <path d="M9.646 4.5H7a.5.5 0 0 0 0 1h2.646a1.5 1.5 0 0 1 0 3H7a.5.5 0 0 0 0 1h2.646a2.5 2.5 0 0 0 0-5z" />
          </svg>
          <span style={styles.urlText}>{formatStepUrl(step.url)}</span>
        </div>

        {step.source && (
          <div style={styles.sourceRow}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill={devtoolsTheme.mint}>
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
            </svg>
            <span style={styles.sourceLink}>{formatSourcePath({ source: step.source })}</span>
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

export { SortableStepItem as StepItem }
