'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { FlowState } from '@flowsterix/core'

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: 'calc(100vh - 40px)',
    backgroundColor: 'hsl(222 47% 11%)',
    borderRadius: 12,
    border: '1px solid hsl(215 20% 25%)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid hsl(215 20% 20%)',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: 'hsl(215 20% 85%)',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsl(215 20% 55%)',
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  body: {
    flex: 1,
    padding: 16,
    overflowY: 'auto' as const,
  },
  textarea: {
    width: '100%',
    minHeight: 300,
    padding: 12,
    backgroundColor: 'hsl(215 20% 8%)',
    border: '1px solid hsl(215 20% 20%)',
    borderRadius: 8,
    color: 'hsl(215 20% 85%)',
    fontSize: 12,
    fontFamily: 'ui-monospace, monospace',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.5,
  },
  textareaError: {
    borderColor: 'hsl(0 70% 50%)',
  },
  error: {
    marginTop: 8,
    padding: '8px 10px',
    backgroundColor: 'hsl(0 70% 50% / 0.15)',
    border: '1px solid hsl(0 70% 50% / 0.3)',
    borderRadius: 6,
    color: 'hsl(0 70% 70%)',
    fontSize: 11,
    fontFamily: 'ui-monospace, monospace',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid hsl(215 20% 20%)',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    backgroundColor: 'hsl(215 20% 20%)',
    border: '1px solid hsl(215 20% 28%)',
    borderRadius: 6,
    color: 'hsl(215 20% 75%)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  buttonPrimary: {
    backgroundColor: 'hsl(217 91% 55%)',
    borderColor: 'hsl(217 91% 60%)',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
} as const

export interface FlowEditModalProps {
  isOpen: boolean
  flowId: string
  initialState: FlowState
  onClose: () => void
  onSave: (state: FlowState) => void
  container?: Element | null
}

export function FlowEditModal(props: FlowEditModalProps) {
  const { isOpen, flowId, initialState, onClose, onSave, container } = props

  const [jsonValue, setJsonValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && initialState) {
      setJsonValue(JSON.stringify(initialState, null, 2))
      setError(null)
    }
  }, [isOpen, initialState])

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonValue) as FlowState
      // Basic validation
      if (typeof parsed.status !== 'string') {
        throw new Error('Missing or invalid "status" field')
      }
      if (typeof parsed.stepIndex !== 'number') {
        throw new Error('Missing or invalid "stepIndex" field')
      }
      if (typeof parsed.version !== 'string') {
        throw new Error('Missing or invalid "version" field')
      }
      onSave(parsed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }, [jsonValue, onSave, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    },
    [onClose, handleSave]
  )

  if (typeof window === 'undefined') return null

  const portalContainer = container ?? document.body

  const textareaStyle: CSSProperties = {
    ...styles.textarea,
    ...(error && styles.textareaError),
  }

  const saveButtonStyle: CSSProperties = {
    ...styles.button,
    ...styles.buttonPrimary,
    ...(error && styles.buttonDisabled),
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            style={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <span style={styles.title}>Edit Flow: {flowId}</span>
              <button
                type="button"
                style={styles.closeButton}
                onClick={onClose}
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>
            </div>

            <div style={styles.body}>
              <textarea
                style={textareaStyle}
                value={jsonValue}
                onChange={(e) => {
                  setJsonValue(e.target.value)
                  setError(null)
                }}
                spellCheck={false}
                autoFocus
              />
              {error && <div style={styles.error}>{error}</div>}
            </div>

            <div style={styles.footer}>
              <button
                type="button"
                style={styles.button}
                onClick={onClose}
              >
                Cancel
              </button>
              <motion.button
                type="button"
                style={saveButtonStyle}
                onClick={handleSave}
                disabled={!!error}
                whileHover={!error ? { scale: 1.02 } : {}}
                whileTap={!error ? { scale: 0.98 } : {}}
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalContainer
  )
}
