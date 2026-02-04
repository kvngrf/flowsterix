'use client'

import type { FlowState } from '@flowsterix/core'
import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useFlowsData } from '../hooks/useFlowsData'
import { FlowItem } from './FlowItem'
import { FlowEditModal } from './FlowEditModal'
import {
  listContainerVariants,
  listItemVariants,
  useReducedMotion,
} from '../motion'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    padding: 10,
    flex: 1,
    overflowY: 'auto' as const,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 10px',
    backgroundColor: 'transparent',
    border: '1px solid hsl(215 20% 25%)',
    borderRadius: 5,
    color: 'hsl(215 20% 60%)',
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  flowList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
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
  noContext: {
    padding: '20px 16px',
    textAlign: 'center' as const,
    color: 'hsl(215 20% 50%)',
    fontSize: 12,
  },
} as const

interface EditModalState {
  isOpen: boolean
  flowId: string
  state: FlowState | null
}

export interface FlowsTabProps {
  container?: Element | null
}

export function FlowsTab(props: FlowsTabProps) {
  const { container } = props
  const { flows, refreshFlows, deleteFlow, updateFlow } = useFlowsData()
  const reducedMotion = useReducedMotion()
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    flowId: '',
    state: null,
  })

  const handleEdit = useCallback((flowId: string, state: FlowState | null) => {
    if (!state) return
    setEditModal({
      isOpen: true,
      flowId,
      state,
    })
  }, [])

  const handleCloseModal = useCallback(() => {
    setEditModal((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleSave = useCallback(
    async (newState: FlowState) => {
      await updateFlow(editModal.flowId, newState)
    },
    [editModal.flowId, updateFlow]
  )

  const handleDelete = useCallback(
    async (flowId: string) => {
      await deleteFlow(flowId)
    },
    [deleteFlow]
  )

  if (flows.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="hsl(215 20% 45%)"
            >
              <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-3 8A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5v-1z" />
            </svg>
          </div>
          <div style={styles.emptyText}>
            <div>No flows registered.</div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'hsl(215 20% 45%)' }}>
              Add flows to TourProvider to see them here.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={{ fontSize: 11, color: 'hsl(215 20% 50%)' }}>
          {flows.length} flow{flows.length !== 1 ? 's' : ''} registered
        </span>
        <motion.button
          type="button"
          style={styles.refreshButton}
          onClick={() => void refreshFlows()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Refresh flow states"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
            />
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
          </svg>
          Refresh
        </motion.button>
      </div>

      <motion.div
        style={styles.flowList}
        variants={reducedMotion ? undefined : listContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {flows.map((flow) => (
            <motion.div
              key={flow.flowId}
              variants={reducedMotion ? undefined : listItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <FlowItem
                flow={flow}
                onEdit={() => handleEdit(flow.flowId, flow.state)}
                onDelete={() => void handleDelete(flow.flowId)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {editModal.state && (
        <FlowEditModal
          isOpen={editModal.isOpen}
          flowId={editModal.flowId}
          initialState={editModal.state}
          onClose={handleCloseModal}
          onSave={handleSave}
          container={container}
        />
      )}
    </div>
  )
}
