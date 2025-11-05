import { useTour } from '../context'

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
  const { back, next, cancel, complete, state, activeFlowId, flows } = useTour()
  const definition = activeFlowId ? flows.get(activeFlowId) : null
  const totalSteps = definition?.steps.length ?? 0
  const stepIndex = state?.stepIndex ?? -1
  const isFirst = stepIndex <= 0
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1

  const goNext = () => {
    if (isLast) {
      complete()
      return
    }
    next()
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={back}
          disabled={isFirst}
          className="rounded-lg border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
        >
          {labels?.back ?? 'Back'}
        </button>
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
      <button
        type="button"
        onClick={goNext}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
      </button>
    </div>
  )
}
