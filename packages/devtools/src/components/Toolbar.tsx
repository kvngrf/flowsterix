'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { motion } from 'motion/react'
import type { GrabMode } from '../types'

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    padding: '10px 10px 0',
  },
  grabRow: {
    display: 'flex',
    gap: 6,
  },
  grabButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: '#252a35',
    border: '1px solid #353d4a',
    borderRadius: 8,
    color: '#a3adc2',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  grabButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    color: '#60a5fa',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
  },
  actionRow: {
    display: 'flex',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '7px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #2d3544',
    borderRadius: 6,
    color: '#8b96a9',
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    position: 'relative' as const,
    outline: 'none',
  },
  actionButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  actionButtonDanger: {
    borderColor: '#7a2c2c',
    color: '#e05555',
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 4px',
    marginLeft: 6,
    backgroundColor: '#1e232c',
    border: '1px solid #2d3544',
    borderRadius: 3,
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    color: '#6b7685',
  },
  copiedBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    padding: '2px 5px',
    backgroundColor: '#166534',
    color: '#86efac',
    fontSize: 9,
    fontWeight: 600,
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
} as const

export interface ToolbarProps {
  mode: GrabMode
  stepCount: number
  onToggleGrab: () => void
  onExport: () => void
  onCopyForAI: () => void
  onReset: () => void
}

export function Toolbar(props: ToolbarProps) {
  const { mode, stepCount, onToggleGrab, onExport, onCopyForAI, onReset } =
    props
  const [copied, setCopied] = useState(false)

  const isGrabbing = mode === 'grabbing'
  const hasSteps = stepCount > 0

  const handleCopy = async () => {
    await onCopyForAI()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const grabButtonStyle: CSSProperties = {
    ...styles.grabButton,
    ...(isGrabbing && styles.grabButtonActive),
  }

  const exportButtonStyle: CSSProperties = {
    ...styles.actionButton,
    ...(!hasSteps && styles.actionButtonDisabled),
  }

  const copyButtonStyle: CSSProperties = {
    ...styles.actionButton,
    ...(!hasSteps && styles.actionButtonDisabled),
  }

  const resetButtonStyle: CSSProperties = {
    ...styles.actionButton,
    ...(!hasSteps && styles.actionButtonDisabled),
    ...(hasSteps && styles.actionButtonDanger),
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.grabRow}>
        <motion.button
          type="button"
          style={grabButtonStyle}
          onClick={onToggleGrab}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGrabbing ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <circle cx="8" cy="8" r="3">
                  <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0.5;1"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="4;7;4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              Grabbing...
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12zM5.904 10.803L10 6.707v2.768a.5.5 0 0 0 1 0V5.5a.5.5 0 0 0-.5-.5H6.525a.5.5 0 1 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 .707.707z" />
              </svg>
              Grab Element
              <span style={styles.kbd}>Ctrl+Shift+G</span>
            </>
          )}
        </motion.button>
      </div>

      <div style={styles.actionRow}>
        <motion.button
          type="button"
          style={exportButtonStyle}
          onClick={onExport}
          disabled={!hasSteps}
          whileHover={hasSteps ? { scale: 1.02 } : {}}
          whileTap={hasSteps ? { scale: 0.98 } : {}}
          title="Download JSON file"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
          </svg>
          Export
        </motion.button>

        <motion.button
          type="button"
          style={copyButtonStyle}
          onClick={handleCopy}
          disabled={!hasSteps}
          whileHover={hasSteps ? { scale: 1.02 } : {}}
          whileTap={hasSteps ? { scale: 0.98 } : {}}
          title="Copy JSON to clipboard"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 1h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" />
            <path d="M14 5a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a1 1 0 0 1 0-2h7V6a1 1 0 0 1 1-1z" />
          </svg>
          Copy
          {copied && (
            <motion.span
              style={styles.copiedBadge}
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Copied!
            </motion.span>
          )}
        </motion.button>

        <motion.button
          type="button"
          style={resetButtonStyle}
          onClick={onReset}
          disabled={!hasSteps}
          whileHover={hasSteps ? { scale: 1.02 } : {}}
          whileTap={hasSteps ? { scale: 0.98 } : {}}
          title="Clear all steps"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path
              fillRule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg>
          Reset
        </motion.button>
      </div>
    </div>
  )
}
