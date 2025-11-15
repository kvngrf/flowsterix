import type { FlowState, Step } from '@tour/core'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence } from 'motion/react'
import { useTour } from '../context'
import { useAdvanceRules } from '../hooks/useAdvanceRules'
import { useTourControls } from '../hooks/useTourControls'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { useTourTarget } from '../hooks/useTourTarget'
import { applyTokensToDocument, cssVar, mergeTokens } from '../theme/tokens'
import { useTourTokens } from '../theme/TokensProvider'
import { isBrowser, portalHost } from '../utils/dom'
import { TourControls } from './TourControls'
import { TourFocusManager } from './TourFocusManager'
import { TourOverlay } from './TourOverlay'
import { TourPopover } from './TourPopover'

const sanitizeForId = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized.length > 0 ? normalized : 'step'
}

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

const ROOT_FONT_SIZE_FALLBACK = 16

let cachedRootFontSize: number | null = null

const getRootFontSize = () => {
  if (!isBrowser) return ROOT_FONT_SIZE_FALLBACK
  if (cachedRootFontSize !== null) return cachedRootFontSize
  const computed = window.getComputedStyle(document.documentElement).fontSize
  const parsed = Number.parseFloat(computed)
  cachedRootFontSize = Number.isNaN(parsed) ? ROOT_FONT_SIZE_FALLBACK : parsed
  return cachedRootFontSize
}

const toNumericRadius = (value?: number | string): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (trimmed.endsWith('rem')) {
    const numeric = Number.parseFloat(trimmed.slice(0, -3))
    if (Number.isNaN(numeric)) return undefined
    return numeric * getRootFontSize()
  }

  if (trimmed.endsWith('px')) {
    const numeric = Number.parseFloat(trimmed.slice(0, -2))
    return Number.isNaN(numeric) ? undefined : numeric
  }

  const numeric = Number.parseFloat(trimmed)
  return Number.isNaN(numeric) ? undefined : numeric
}

export const TourHUD = ({
  overlayPadding,
  overlayRadius,
  showControls = true,
  renderStep,
  zIndex = 1000,
}: TourHUDProps) => {
  const tokens = useTourTokens()
  const { state, activeStep, activeFlowId, flows } = useTour()
  const target = useTourTarget()
  useAdvanceRules(target)

  const isRunning = state?.status === 'running'
  const runningState = isRunning ? state : null
  const runningStep = runningState && activeStep ? activeStep : null
  const [shouldRender, setShouldRender] = useState(Boolean(runningStep))
  const [popoverNode, setPopoverNode] = useState<HTMLDivElement | null>(null)

  const flowHudOptions = activeFlowId ? flows.get(activeFlowId)?.hud : null
  const popoverOptions = flowHudOptions?.popover
  const hudTokenOverrides = flowHudOptions?.tokens
  const hasHudTokenOverrides = Boolean(
    hudTokenOverrides && Object.keys(hudTokenOverrides).length > 0,
  )

  const mergedHudTokens = useMemo(() => {
    if (!hasHudTokenOverrides || !hudTokenOverrides) return null
    return mergeTokens(tokens, hudTokenOverrides)
  }, [hasHudTokenOverrides, hudTokenOverrides, tokens])

  useEffect(() => {
    if (!hasHudTokenOverrides || !isRunning || !mergedHudTokens) return
    const cleanup = applyTokensToDocument(mergedHudTokens)
    return cleanup
  }, [hasHudTokenOverrides, isRunning, mergedHudTokens])

  const activeTokens =
    hasHudTokenOverrides && mergedHudTokens ? mergedHudTokens : tokens

  const tokenOverlayRadius = toNumericRadius(activeTokens.overlay.radius)

  const resolvedOverlayPadding = overlayPadding ?? undefined
  const resolvedOverlayRadius = overlayRadius ?? tokenOverlayRadius ?? undefined

  const resolvedPopoverOffset = popoverOptions?.offset ?? 20
  const resolvedPopoverRole = popoverOptions?.role ?? 'dialog'
  const resolvedPopoverAriaLabel = popoverOptions?.ariaLabel
  const resolvedPopoverAriaDescribedBy = popoverOptions?.ariaDescribedBy
  const resolvedPopoverAriaModal = popoverOptions?.ariaModal ?? false

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
  const focusTrapActive = canRenderStep
  const targetDescription =
    runningStep && typeof runningStep.target === 'object'
      ? (runningStep.target.description ?? null)
      : null

  const descriptionId =
    targetDescription && runningStep
      ? `tour-step-${sanitizeForId(runningStep.id)}-description`
      : undefined

  const combinedAriaDescribedBy =
    [resolvedPopoverAriaDescribedBy, descriptionId].filter(Boolean).join(' ') ||
    undefined

  return (
    <>
      <TourFocusManager
        active={focusTrapActive}
        target={target}
        popoverNode={popoverNode}
      />
      <TourKeyboardShortcuts target={target} />
      <TourOverlay
        target={target}
        padding={resolvedOverlayPadding}
        radius={resolvedOverlayRadius}
        zIndex={zIndex}
      />
      <AnimatePresence>
        {canRenderStep && runningStep && runningState ? (
          renderStep ? (
            renderStep({ step: runningStep, state: runningState, target })
          ) : (
            <TourPopover
              target={target}
              zIndex={zIndex + 1}
              offset={resolvedPopoverOffset}
              placement={runningStep.placement}
              role={resolvedPopoverRole}
              ariaLabel={resolvedPopoverAriaLabel}
              ariaDescribedBy={combinedAriaDescribedBy}
              ariaModal={resolvedPopoverAriaModal}
              descriptionId={descriptionId}
              descriptionText={targetDescription ?? undefined}
              onContainerChange={setPopoverNode}
            >
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

  const isInteractiveElement = (node: Element | null) => {
    if (!node) return false
    if (node.getAttribute('role') === 'button') return true
    if (node.hasAttribute('contenteditable')) return true
    const interactiveSelector =
      'button, a[href], input, textarea, select, summary, [role="button"], [data-tour-prevent-shortcut="true"]'
    return Boolean(node.closest(interactiveSelector))
  }

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
        if (event.target instanceof Element) {
          if (target.element && target.element.contains(event.target)) {
            return
          }
          if (event.target.closest('[data-tour-popover]')) {
            return
          }
          if (isInteractiveElement(event.target)) {
            return
          }
        }
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
      className="fixed bottom-4 right-4 min-w-[260px] max-w-[320px] rounded-xl bg-slate-900 px-5 py-4 font-mono text-xs text-white pointer-events-auto"
      style={{
        zIndex,
        boxShadow: cssVar(
          'shadow.hud.panel',
          '0 24px 50px -25px rgba(15,23,42,0.65)',
        ),
      }}
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
