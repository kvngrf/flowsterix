import type { FlowState, Step } from '@tour/core'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence } from 'motion/react'
import { useTour } from '../context'
import { useAdvanceRules } from '../hooks/useAdvanceRules'
import { useTourControls } from '../hooks/useTourControls'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { useTourTarget } from '../hooks/useTourTarget'
import { isBrowser, portalHost } from '../utils/dom'
import { TourControls } from './TourControls'
import { TourOverlay } from './TourOverlay'
import { TourPopover } from './TourPopover'

export interface TourHUDRenderContext {
  step: Step<ReactNode>
  state: FlowState
  target: TourTargetInfo
}

export interface TourHUDProps {
  overlayPadding?: number
  overlayRadius?: number
  showControls?: boolean
  renderStep?: (context: TourHUDRenderContext) => ReactNode
  zIndex?: number
}

export const TourHUD = ({
  overlayPadding,
  overlayRadius,
  showControls = true,
  renderStep,
  zIndex = 1000,
}: TourHUDProps) => {
  const { state, activeStep } = useTour()
  const target = useTourTarget()
  useAdvanceRules(target)

  const isRunning = state?.status === 'running'
  const runningState = isRunning ? state : null
  const runningStep = runningState && activeStep ? activeStep : null
  const [shouldRender, setShouldRender] = useState(Boolean(runningStep))

  useEffect(() => {
    if (isRunning) {
      setShouldRender(true)
    }
  }, [isRunning])

  useEffect(() => {
    if (!shouldRender) return
    if (isRunning) return
    if (target.status !== 'idle') return

    const EXIT_BUFFER_MS = 450
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
    }, EXIT_BUFFER_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isRunning, shouldRender, target.status])

  if (!shouldRender) {
    return null
  }

  const canRenderStep = Boolean(runningStep && runningState)

  return (
    <>
      <TourKeyboardShortcuts target={target} />
      <TourOverlay
        target={target}
        padding={overlayPadding}
        radius={overlayRadius}
        zIndex={zIndex}
      />
      <AnimatePresence>
        {canRenderStep && runningStep && runningState ? (
          renderStep ? (
            renderStep({ step: runningStep, state: runningState, target })
          ) : (
            <TourPopover target={target} zIndex={zIndex + 1} offset={20}>
              {runningStep.content}
              {showControls ? <TourControls /> : null}
            </TourPopover>
          )
        ) : null}
      </AnimatePresence>
      <TourDebugPanel target={target} zIndex={zIndex + 2} />
    </>
  )
}

interface TourKeyboardShortcutsProps {
  target: TourTargetInfo
}

const TourKeyboardShortcuts = ({ target }: TourKeyboardShortcutsProps) => {
  const { state } = useTour()
  const { cancel, canGoBack, goBack, canGoNext, goNext, isActive } =
    useTourControls()

  useEffect(() => {
    if (!isBrowser) return
    if (!state || state.status !== 'running') return
    if (!isActive) return

    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      if (event.key === 'Escape') {
        cancel('keyboard')
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowLeft') {
        if (canGoBack) {
          goBack()
          event.preventDefault()
        }
        return
      }

      if (event.key === 'ArrowRight') {
        if (canGoNext) {
          goNext()
          event.preventDefault()
        }
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (target.status !== 'ready') return
        if (canGoNext) {
          goNext()
          event.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [
    cancel,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    isActive,
    state,
    target.status,
  ])

  return null
}

interface TourDebugPanelProps {
  target: TourTargetInfo
  zIndex: number
}

const TourDebugPanel = ({ target, zIndex }: TourDebugPanelProps) => {
  const { activeStep, state, debugEnabled, toggleDebug } = useTour()

  if (!isBrowser || !debugEnabled) {
    return null
  }

  const host = portalHost()
  if (!host) return null

  return createPortal(
    <div
      className="fixed bottom-4 right-4 min-w-[260px] max-w-[320px] rounded-xl bg-slate-900 px-5 py-4 font-mono text-xs text-white shadow-[0_24px_50px_-25px_rgba(15,23,42,0.65)] pointer-events-auto"
      style={{ zIndex }}
    >
      <div className="mb-3 flex items-center justify-between font-semibold tracking-[0.02em]">
        <span>Tour Debug</span>
        <button
          type="button"
          onClick={toggleDebug}
          className="rounded-md px-1.5 py-1 text-[11px] text-slate-200 transition-colors hover:bg-slate-800 hover:text-slate-50"
        >
          Close
        </button>
      </div>
      <div className="grid gap-1.5">
        <div className="flex justify-between gap-3 whitespace-nowrap">
          <span>Step</span>
          <span>{activeStep?.id ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-3 whitespace-nowrap">
          <span>Status</span>
          <span>{state?.status ?? 'idle'}</span>
        </div>
        <div className="flex justify-between gap-3 whitespace-nowrap">
          <span>Target</span>
          <span>
            {target.isScreen
              ? 'screen'
              : target.element
                ? 'element'
                : 'pending'}
          </span>
        </div>
        <div className="flex justify-between gap-3 whitespace-nowrap">
          <span>Rect</span>
          <span>
            {target.rect
              ? `${Math.round(target.rect.width)}×${Math.round(target.rect.height)}`
              : '—'}
          </span>
        </div>
        <div className="flex justify-between gap-3 whitespace-nowrap">
          <span>Updated</span>
          <span>{new Date(target.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>,
    host,
  )
}
