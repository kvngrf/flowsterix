import type { FlowState, Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence } from 'motion/react'
import { useTour } from '../context'
import type { HudTargetIssue } from '../hooks/useHudTargetIssue'
import { useTourHud } from '../hooks/useTourHud'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { cssVar } from '../theme/tokens'
import { isBrowser, portalHost } from '../utils/dom'
import { TourControls } from './TourControls'
import { TourFocusManager } from './TourFocusManager'
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
  const hud = useTourHud({ overlayPadding, overlayRadius })
  const {
    hudState,
    disableDefaultHud,
    overlay,
    popover,
    description,
    focusManager,
    targetIssue,
  } = hud
  const { runningState, runningStep, shouldRender, canRenderStep, target } =
    hudState

  if (!shouldRender) {
    return null
  }

  return (
    <>
      {disableDefaultHud ? null : (
        <TourFocusManager
          active={focusManager.active}
          target={focusManager.target}
          popoverNode={focusManager.popoverNode}
        />
      )}
      {disableDefaultHud ? null : (
        <>
          <TourOverlay
            target={focusManager.target}
            padding={overlay.padding}
            radius={overlay.radius}
            zIndex={zIndex}
            interactionMode={overlay.interactionMode}
          />
          <AnimatePresence>
            {canRenderStep && runningStep && runningState ? (
              renderStep ? (
                renderStep({
                  step: runningStep,
                  state: runningState,
                  target,
                })
              ) : (
                <TourPopover
                  target={focusManager.target}
                  zIndex={zIndex + 1}
                  offset={popover.offset}
                  placement={popover.placement}
                  role={popover.role}
                  ariaLabel={popover.ariaLabel}
                  ariaDescribedBy={description.combinedAriaDescribedBy}
                  ariaModal={popover.ariaModal}
                  descriptionId={description.descriptionId}
                  descriptionText={description.text ?? undefined}
                  onContainerChange={focusManager.setPopoverNode}
                >
                  <TargetIssueNotice issue={targetIssue.issue} />
                  {runningStep.content}
                  {showControls ? <TourControls /> : null}
                </TourPopover>
              )
            ) : null}
          </AnimatePresence>
        </>
      )}
      <TourDebugPanel target={target} zIndex={zIndex + 2} />
    </>
  )
}

const TargetIssueNotice = ({ issue }: { issue: HudTargetIssue | null }) => {
  if (!issue) {
    return null
  }

  return (
    <div
      data-tour-target-alert=""
      data-variant={issue.type}
      role="status"
      aria-live="polite"
    >
      <div data-tour-target-alert-icon="" aria-hidden>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <div data-tour-target-alert-body="">
        <p data-tour-target-alert-title="">{issue.title}</p>
        <p>{issue.body}</p>
        {issue.hint ? <p data-tour-target-alert-hint="">{issue.hint}</p> : null}
      </div>
    </div>
  )
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
