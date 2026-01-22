import { createContext, useContext } from 'react'

export interface TourLabels {
  // Visible labels
  back: string
  next: string
  finish: string
  skip: string
  holdToConfirm: string

  // Aria labels (separate for screen readers)
  ariaStepProgress: (params: { current: number; total: number }) => string
  ariaTimeRemaining: (params: { ms: number }) => string
  ariaDelayProgress: string

  // Visible formatters
  formatTimeRemaining: (params: { ms: number }) => string
}

export const defaultLabels: TourLabels = {
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  skip: 'Skip tour',
  holdToConfirm: 'Hold to confirm',

  ariaStepProgress: ({ current, total }) => `Step ${current} of ${total}`,
  ariaTimeRemaining: ({ ms }) =>
    `${Math.ceil(ms / 1000)} seconds remaining`,
  ariaDelayProgress: 'Auto-advance progress',

  formatTimeRemaining: ({ ms }) => `${Math.ceil(ms / 1000)}s remaining`,
}

const LabelsContext = createContext<TourLabels>(defaultLabels)

export const LabelsProvider = LabelsContext.Provider

export function useTourLabels(): TourLabels {
  return useContext(LabelsContext)
}
