'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { ElementInfo } from '../types'
import { formatSourcePath } from '../utils/sourceExtractor'
import { springs, useReducedMotion } from '../motion'
import { devtoolsTheme } from '../theme'

const styles = {
  root: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: 99999,
  },
  highlight: {
    position: 'absolute' as const,
    border: `2px solid ${devtoolsTheme.primary}`,
    backgroundColor: devtoolsTheme.primarySoft,
    borderRadius: 6,
    pointerEvents: 'none' as const,
    boxShadow: `0 0 0 4px ${devtoolsTheme.primarySoft}, 0 4px 20px ${devtoolsTheme.primaryGlow}`,
  },
  highlightPulse: {
    boxShadow: '0 0 0 8px rgba(146, 196, 176, 0.28), 0 4px 20px rgba(146, 196, 176, 0.38)',
    borderColor: devtoolsTheme.mint,
  },
  label: {
    position: 'absolute' as const,
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: '8px 10px',
    backgroundColor: devtoolsTheme.bgPanel,
    border: `1px solid ${devtoolsTheme.border}`,
    color: devtoolsTheme.textSecondary,
    fontSize: 11,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    maxWidth: 280,
  },
  labelTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
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
  selector: {
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
  source: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: devtoolsTheme.mint,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
  },
  hint: {
    position: 'fixed' as const,
    bottom: 20,
    left: '50%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    backgroundColor: devtoolsTheme.bgPanel,
    border: `1px solid ${devtoolsTheme.border}`,
    color: devtoolsTheme.textSecondary,
    fontSize: 12,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  hintItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: devtoolsTheme.textSecondary,
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 5px',
    backgroundColor: devtoolsTheme.bgPanelInset,
    border: `1px solid ${devtoolsTheme.borderSoft}`,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    color: devtoolsTheme.textMuted,
    fontWeight: 500,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: devtoolsTheme.borderStrong,
  },
} as const


export interface GrabberOverlayProps {
  isGrabbing: boolean
  hoveredInfo: ElementInfo | null
  container?: Element | DocumentFragment | null
  onElementSelected?: () => void
}

export function GrabberOverlay(props: GrabberOverlayProps) {
  const { isGrabbing, hoveredInfo, container, onElementSelected } = props
  const reducedMotion = useReducedMotion()
  const [showPulse, setShowPulse] = useState(false)

  // Trigger pulse animation when element is selected
  useEffect(() => {
    if (onElementSelected) {
      // This effect doesn't directly trigger, but the parent can call it
    }
  }, [onElementSelected])

  // Listen for selection pulse trigger
  useEffect(() => {
    const handlePulse = () => {
      if (reducedMotion) return
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 300)
    }

    // Expose pulse trigger on window for parent to call
    ;(window as unknown as { __devtools_pulse?: () => void }).__devtools_pulse = handlePulse

    return () => {
      delete (window as unknown as { __devtools_pulse?: () => void }).__devtools_pulse
    }
  }, [reducedMotion])

  if (typeof window === 'undefined') return null

  const portalContainer = container ?? document.body

  const labelStyle: CSSProperties = {
    ...styles.label,
  }

  // Reposition label if near top of viewport
  if (hoveredInfo && hoveredInfo.rect.top < 80) {
    labelStyle.bottom = 'auto'
    labelStyle.top = '100%'
    labelStyle.marginBottom = 0
    labelStyle.marginTop = 6
  }

  // Reposition label if near right edge
  if (hoveredInfo && hoveredInfo.rect.left > window.innerWidth - 300) {
    labelStyle.left = 'auto'
    labelStyle.right = 0
  }

  const highlightStyle: CSSProperties = {
    ...styles.highlight,
    ...(showPulse && styles.highlightPulse),
  }

  return createPortal(
    <div style={styles.root} data-devtools-panel="">
      <AnimatePresence>
        {isGrabbing && hoveredInfo && (
          <motion.div
            key="grabber-highlight"
            style={highlightStyle}
            initial={{
              top: hoveredInfo.rect.top,
              left: hoveredInfo.rect.left,
              width: hoveredInfo.rect.width,
              height: hoveredInfo.rect.height,
              opacity: 0,
            }}
            animate={{
              top: hoveredInfo.rect.top,
              left: hoveredInfo.rect.left,
              width: hoveredInfo.rect.width,
              height: hoveredInfo.rect.height,
              opacity: 1,
              scale: showPulse ? 1.02 : 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={reducedMotion ? { duration: 0 } : springs.grabber}
          >
            <motion.div
              style={labelStyle}
              initial={reducedMotion ? {} : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : { delay: 0.03, duration: 0.12 }}
            >
              <div style={styles.labelTop}>
                <span style={styles.tagBadge}>
                  &lt;{hoveredInfo.tag}&gt;
                </span>
                {hoveredInfo.text && (
                  <span
                    style={{
                      color: devtoolsTheme.textSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 150,
                      fontSize: 11,
                    }}
                  >
                    {hoveredInfo.text}
                  </span>
                )}
              </div>
              <div style={styles.selector}>{hoveredInfo.selector}</div>
              {hoveredInfo.source && (
                <div style={styles.source}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                  </svg>
                  {formatSourcePath({ source: hoveredInfo.source })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isGrabbing && (
          <motion.div
            key="grabber-hint"
            style={styles.hint}
            initial={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            transition={reducedMotion ? { duration: 0 } : springs.smooth}
          >
            <div style={styles.hintItem}>
              <span style={styles.kbd}>Click</span>
              <span>Add step</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.hintItem}>
              <span style={styles.kbd}>ESC</span>
              <span>Cancel</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.hintItem}>
              <span style={styles.kbd}>Ctrl+Shift+G</span>
              <span>Toggle</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    portalContainer
  )
}
