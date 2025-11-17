import { createPortal } from 'react-dom'

import {
  useTour,
  useTourControls,
  useTourTarget,
} from '@tour/headless'

const HEADLESS_FLOW_ID = 'headless-demo'

export const HeadlessHUD = () => {
  if (typeof document === 'undefined') {
    return null
  }

  const { state, activeStep, activeFlowId } = useTour()
  const controls = useTourControls()
  const target = useTourTarget()

  if (state?.status !== 'running') return null
  if (activeFlowId !== HEADLESS_FLOW_ID) return null
  if (!activeStep) return null

  const rect = target.rect ?? target.lastResolvedRect ?? null

  const highlight = rect
    ? {
        position: 'fixed' as const,
        left: rect.left - 8,
        top: rect.top - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: '18px',
        border: '2px solid rgba(82,255,168,0.9)',
        boxShadow:
          '0 0 25px rgba(82,255,168,0.8), 0 0 70px rgba(82,255,168,0.45)',
        pointerEvents: 'none' as const,
        zIndex: 2001,
      }
    : null

  const popoverPosition = (() => {
    if (!rect) {
      return {
        top: '15%',
        left: '50%',
        transform: 'translate(-50%, 0)',
      }
    }
    const preferredTop = rect.bottom + 32
    const maxTop = window.innerHeight - 160
    const top = Math.min(preferredTop, maxTop)
    const left = rect.left + rect.width / 2
    return {
      top,
      left,
      transform: 'translate(-50%, 0)',
    }
  })()

  const popoverStyle = {
    position: 'fixed' as const,
    zIndex: 2002,
    padding: '1.25rem',
    borderRadius: '1rem',
    minWidth: '280px',
    maxWidth: '360px',
    background: 'rgba(5, 12, 25, 0.95)',
    border: '1px solid rgba(82,255,168,0.4)',
    boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
    color: '#e9fbf2',
    ...popoverPosition,
  }

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginTop: '1rem',
  }

  const buttonStyle = (variant: 'primary' | 'ghost') => ({
    flex: variant === 'ghost' ? '0' : '1',
    padding: '0.55rem 1rem',
    borderRadius: '999px',
    border: variant === 'ghost' ? '1px solid rgba(233,251,242,0.4)' : 'none',
    background:
      variant === 'ghost'
        ? 'transparent'
        : 'linear-gradient(120deg, rgba(82,255,168,0.95), rgba(49,148,255,0.95))',
    color: variant === 'ghost' ? '#e9fbf2' : '#041018',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: variant === 'primary' && !controls.canGoNext ? 0.6 : 1,
  })

  return createPortal(
    <div data-headless-hud="">
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 20% 20%, rgba(0,255,170,0.14), transparent 45%), rgba(2,6,23,0.65)',
          zIndex: 2000,
        }}
      />
      {highlight ? <div style={highlight} aria-hidden /> : null}
      <section style={popoverStyle} role="dialog">
        <div style={{ display: 'grid', gap: '0.75rem' }}>{activeStep.content}</div>
        <div style={controlsStyle}>
          <button
            type="button"
            onClick={controls.goBack}
            disabled={!controls.canGoBack}
            style={{ ...buttonStyle('ghost'), opacity: controls.canGoBack ? 1 : 0.4 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={controls.goNext}
            disabled={!controls.canGoNext}
            style={buttonStyle('primary')}
          >
            {controls.canGoNext ? 'Next' : 'Finish'}
          </button>
          <button
            type="button"
            onClick={() => controls.cancel('headless-demo')}
            style={buttonStyle('ghost')}
          >
            Skip
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
