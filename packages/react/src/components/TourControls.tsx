import { useTourControls } from '../hooks/useTourControls'

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

  return (
    <div
      data-tour-controls=""
      data-has-next={showNextButton ? 'true' : 'false'}
    >
      <div data-tour-controls-group="secondary">
        {showBackButton ? (
          <button
            type="button"
            onClick={() => goBack()}
            disabled={backDisabled}
            data-tour-button="secondary"
            data-role="back"
          >
            {labels?.back ?? 'Back'}
          </button>
        ) : null}
        {!hideSkip && (
          <button
            type="button"
            onClick={() => cancel('skipped')}
            data-tour-button="secondary"
            data-role="skip"
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
          data-tour-button="primary"
          data-role={isLast ? 'finish' : 'next'}
        >
          {isLast ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
        </button>
      ) : null}
    </div>
  )
}
