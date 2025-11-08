import { useTourControls } from '../hooks/useTourControls'
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
    showBackButton,
    backDisabled,
    goBack,
    showNextButton,
    nextDisabled,
    goNext,
    isLast,
    cancel,
  } = useTourControls()

  const layoutClassName = cn(
    'mt-6 flex items-center gap-3',
    showNextButton ? 'justify-between' : 'justify-start',
  )

  return (
    <div className={layoutClassName}>
      <div className="flex gap-2">
        {showBackButton ? (
          <button
            type="button"
            onClick={() => goBack()}
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
      {showNextButton ? (
        <button
          type="button"
          onClick={() => goNext()}
          disabled={nextDisabled}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-slate-900"
        >
          {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
        </button>
      ) : null}
    </div>
  )
}
