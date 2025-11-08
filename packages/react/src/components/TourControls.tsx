import { useMemo } from 'react'

import { useTour } from '../context'
import { cn } from '../utils/cn'

export interface TourControlsProps {
  hideSkip?: boolean
  labels?: {
    back?: string
    next?: string
    finish?: string
    skip?: string
  }
}

export const TourControls = ({ hideSkip, labels }: TourControlsProps) => {
  const {
    back,
    next,
    cancel,
    complete,
    state,
    activeFlowId,
    flows,
    activeStep,
  } = useTour()
  const definition = activeFlowId ? flows.get(activeFlowId) : null
  const totalSteps = definition?.steps.length ?? 0
  const stepIndex = state?.stepIndex ?? -1
  const isFirst = stepIndex <= 0
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1

  const previousStep =
    !definition || stepIndex <= 0 ? null : definition.steps[stepIndex - 1]

  const advanceRules = activeStep?.advance ?? []
  const hasAdvanceRules = advanceRules.length > 0
  const hasManualAdvance = advanceRules.some((rule) => rule.type === 'manual')
  const hasNonManualAdvance = advanceRules.some(
    (rule) => rule.type !== 'manual',
  )

  const previousAdvanceRules = previousStep?.advance ?? []
  const previousAdvancedViaRoute = previousAdvanceRules.some(
    (rule) => rule.type === 'route',
  )
  const previousAdvancedViaTargetEvent = previousAdvanceRules.some(
    (rule) => rule.type === 'event' && rule.on === 'target',
  )

  type ControlState = 'auto' | 'hidden' | 'disabled'
  const resolveControlState = (value: ControlState | undefined): ControlState =>
    value ?? 'auto'

  const backControlState = resolveControlState(activeStep?.controls?.back)
  const nextControlState = resolveControlState(activeStep?.controls?.next)

  const showBack = useMemo(() => {
    if (backControlState === 'hidden') return false
    if (isFirst) return false
    if (previousAdvancedViaRoute || previousAdvancedViaTargetEvent) {
      return false
    }
    return true
  }, [
    backControlState,
    isFirst,
    previousAdvancedViaRoute,
    previousAdvancedViaTargetEvent,
  ])

  const backDisabled = backControlState === 'disabled'

  const showNext = useMemo(() => {
    if (nextControlState === 'hidden') return false
    if (isLast) return true
    if (!hasAdvanceRules) return true
    if (hasManualAdvance && !hasNonManualAdvance) return true
    if (hasManualAdvance && hasNonManualAdvance) return true
    return false
  }, [
    hasAdvanceRules,
    hasManualAdvance,
    hasNonManualAdvance,
    isLast,
    nextControlState,
  ])

  const nextDisabled = nextControlState === 'disabled'

  const goNext = () => {
    if (nextDisabled) return
    if (isLast) {
      complete()
      return
    }
    next()
  }

  const layoutClassName = cn(
    'mt-6 flex items-center gap-3',
    showNext ? 'justify-between' : 'justify-start',
  )

  return (
    <div className={layoutClassName}>
      <div className="flex gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={back}
            disabled={backDisabled}
            className="rounded-lg border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
          >
            {labels?.back ?? 'Back'}
          </button>
        ) : null}
        {!hideSkip && (
          <button
            type="button"
            onClick={() => cancel('skipped')}
            className="rounded-lg border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {labels?.skip ?? 'Skip tour'}
          </button>
        )}
      </div>
      {showNext ? (
        <button
          type="button"
          onClick={goNext}
          disabled={nextDisabled}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-slate-900"
        >
          {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
        </button>
      ) : null}
    </div>
  )
}
