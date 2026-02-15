'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { FlowState } from '@flowsterix/core'
import { springs, useReducedMotion } from '../motion'
import { devtoolsTheme } from '../theme'

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
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
    backgroundColor: devtoolsTheme.bgPanel,
    borderRadius: 12,
    border: `1px solid ${devtoolsTheme.border}`,
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
    borderBottom: `1px solid ${devtoolsTheme.borderSoft}`,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: devtoolsTheme.textPrimary,
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
    border: 'none',
    color: devtoolsTheme.textMuted,
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
    backgroundColor: devtoolsTheme.bgPanelInsetStrong,
    border: `1px solid ${devtoolsTheme.borderSoft}`,
    borderRadius: 8,
    color: devtoolsTheme.textPrimary,
    fontSize: 12,
    fontFamily: 'ui-monospace, monospace',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.5,
    transition: 'border-color 0.15s ease',
  },
  textareaError: {
    borderColor: devtoolsTheme.accentStrong,
  },
  error: {
    marginTop: 8,
    padding: '8px 10px',
    backgroundColor: devtoolsTheme.accentSoft,
    border: `1px solid ${devtoolsTheme.accentStrong}`,
    borderRadius: 6,
    color: devtoolsTheme.accent,
    fontSize: 11,
    fontFamily: 'ui-monospace, monospace',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    borderTop: `1px solid ${devtoolsTheme.borderSoft}`,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    backgroundColor: devtoolsTheme.bgPanelAlt,
    border: `1px solid ${devtoolsTheme.border}`,
    borderRadius: 6,
    color: devtoolsTheme.textSecondary,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  buttonPrimary: {
    background: devtoolsTheme.gradientMain,
    borderColor: devtoolsTheme.primaryStrong,
    color: devtoolsTheme.textPrimary,
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
  const [shake, setShake] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (isOpen && initialState) {
      setJsonValue(JSON.stringify(initialState, null, 2))
      setError(null)
    }
  }, [isOpen, initialState])

  const triggerShake = useCallback(() => {
    if (reducedMotion) return
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }, [reducedMotion])

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
      triggerShake()
    }
  }, [jsonValue, onSave, onClose, triggerShake])

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
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            style={styles.modal}
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: shake ? [0, -8, 8, -6, 6, -4, 4, 0] : 0,
            }}
            exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 10 }}
            transition={reducedMotion ? { duration: 0 } : springs.smooth}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <span style={styles.title}>Edit Flow: {flowId}</span>
              <motion.button
                type="button"
                style={styles.closeButton}
                onClick={onClose}
                title="Close"
                whileHover={reducedMotion ? {} : { scale: 1.1 }}
                whileTap={reducedMotion ? {} : { scale: 0.9 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </motion.button>
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
              <AnimatePresence>
                {error && (
                  <motion.div
                    style={styles.error}
                    initial={reducedMotion ? {} : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? {} : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={styles.footer}>
              <motion.button
                type="button"
                style={styles.button}
                onClick={onClose}
                whileHover={reducedMotion ? {} : { scale: 1.02 }}
                whileTap={reducedMotion ? {} : { scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                style={saveButtonStyle}
                onClick={handleSave}
                disabled={!!error}
                whileHover={!error && !reducedMotion ? { scale: 1.02 } : {}}
                whileTap={!error && !reducedMotion ? { scale: 0.98 } : {}}
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
