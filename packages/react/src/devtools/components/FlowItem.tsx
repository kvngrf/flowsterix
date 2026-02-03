'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { FlowData } from '../hooks/useFlowsData'
import { springs, useReducedMotion } from '../motion'

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    padding: 12,
    backgroundColor: 'hsl(215 20% 16%)',
    borderRadius: 8,
    border: '1px solid hsl(215 20% 22%)',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  cardHover: {
    borderColor: 'hsl(215 20% 28%)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  cardActive: {
    borderColor: 'hsl(217 91% 55% / 0.5)',
    backgroundColor: 'hsl(217 91% 55% / 0.05)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  flowId: {
    fontWeight: 600,
    color: 'hsl(215 20% 85%)',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 500,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusIdle: {
    backgroundColor: 'hsl(215 20% 22%)',
    color: 'hsl(215 20% 60%)',
  },
  statusRunning: {
    backgroundColor: 'hsl(142 71% 45% / 0.2)',
    color: 'hsl(142 71% 60%)',
  },
  statusPaused: {
    backgroundColor: 'hsl(45 93% 47% / 0.2)',
    color: 'hsl(45 93% 60%)',
  },
  statusCompleted: {
    backgroundColor: 'hsl(217 91% 55% / 0.2)',
    color: 'hsl(217 91% 70%)',
  },
  statusCancelled: {
    backgroundColor: 'hsl(0 70% 50% / 0.2)',
    color: 'hsl(0 70% 65%)',
  },
  activeBadge: {
    backgroundColor: 'hsl(142 71% 45% / 0.2)',
    color: 'hsl(142 71% 60%)',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'hsl(215 20% 55%)',
    fontSize: 11,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: 'hsl(215 20% 45%)',
  },
  value: {
    fontFamily: 'ui-monospace, monospace',
    color: 'hsl(215 20% 65%)',
  },
  actions: {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 10px',
    backgroundColor: 'transparent',
    border: '1px solid hsl(215 20% 25%)',
    borderRadius: 5,
    color: 'hsl(215 20% 60%)',
    fontSize: 10,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  actionButtonDanger: {
    borderColor: 'hsl(0 70% 40%)',
    color: 'hsl(0 70% 60%)',
  },
  noState: {
    padding: '8px 0',
    color: 'hsl(215 20% 45%)',
    fontSize: 11,
    fontStyle: 'italic' as const,
  },
} as const

const statusStyles: Record<string, CSSProperties> = {
  idle: styles.statusIdle,
  running: styles.statusRunning,
  paused: styles.statusPaused,
  completed: styles.statusCompleted,
  cancelled: styles.statusCancelled,
}

export interface FlowItemProps {
  flow: FlowData
  onEdit: () => void
  onDelete: () => void
}

export function FlowItem(props: FlowItemProps) {
  const { flow, onEdit, onDelete } = props
  const { flowId, definition, state, isActive } = flow

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const reducedMotion = useReducedMotion()

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete()
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      // Reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const cardStyle: CSSProperties = {
    ...styles.card,
    ...(isHovered && styles.cardHover),
    ...(isActive && styles.cardActive),
  }

  const statusBadgeStyle: CSSProperties = {
    ...styles.statusBadge,
    ...(state ? statusStyles[state.status] || styles.statusIdle : styles.statusIdle),
  }

  const deleteButtonStyle: CSSProperties = {
    ...styles.actionButton,
    ...(confirmDelete && styles.actionButtonDanger),
  }

  const stepInfo = state
    ? `Step ${state.stepIndex + 1}/${definition.steps.length}`
    : null

  const currentStatus = state?.status ?? 'no state'

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.flowId}>{flowId}</span>
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.span
                key="active-badge"
                style={{ ...styles.statusBadge, ...styles.activeBadge }}
                initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : springs.bouncy}
              >
                Active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStatus}
            style={statusBadgeStyle}
            initial={reducedMotion ? {} : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? {} : { scale: 0.9, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
          >
            {currentStatus}
          </motion.span>
        </AnimatePresence>
      </div>

      {state ? (
        <div style={styles.infoRow}>
          {stepInfo && (
            <div style={styles.infoItem}>
              <span style={styles.label}>Step:</span>
              <span style={styles.value}>{stepInfo}</span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.label}>Version:</span>
            <span style={styles.value}>{state.version}</span>
          </div>
          {state.stepId && (
            <div style={styles.infoItem}>
              <span style={styles.label}>ID:</span>
              <span style={styles.value}>{state.stepId}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.noState}>No stored state</div>
      )}

      <div style={styles.actions}>
        <motion.button
          type="button"
          style={styles.actionButton}
          onClick={onEdit}
          disabled={!state}
          whileHover={state && !reducedMotion ? { scale: 1.02 } : {}}
          whileTap={state && !reducedMotion ? { scale: 0.98 } : {}}
          title={state ? 'Edit flow state' : 'No state to edit'}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
          </svg>
          Edit
        </motion.button>

        <motion.button
          type="button"
          style={deleteButtonStyle}
          onClick={handleDelete}
          disabled={!state}
          whileHover={state && !reducedMotion ? { scale: 1.02 } : {}}
          whileTap={state && !reducedMotion ? { scale: 0.98 } : {}}
          title={
            confirmDelete
              ? 'Click again to confirm deletion'
              : state
              ? 'Delete flow state'
              : 'No state to delete'
          }
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path
              fillRule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg>
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </motion.button>
      </div>
    </div>
  )
}
