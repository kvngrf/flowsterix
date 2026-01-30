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

  // Target issue labels (shown when target element is problematic)
  targetIssue: {
    missingTitle: string
    missingBody: string
    missingHint: string
    hiddenTitle: string
    hiddenBody: string
    hiddenHint: string
    detachedTitle: string
    detachedBody: string
  }
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

  targetIssue: {
    missingTitle: 'Target not visible',
    missingBody:
      'The target element is not currently visible. Make sure the UI piece is mounted and displayed.',
    missingHint: 'Showing the last known position until the element returns.',
    hiddenTitle: 'Target not visible',
    hiddenBody:
      'The target element is not currently visible. Make sure the UI piece is mounted and displayed.',
    hiddenHint: 'Showing the last known position until the element returns.',
    detachedTitle: 'Target left the page',
    detachedBody:
      'Navigate back to the screen that contains this element or reopen it before continuing the tour.',
  },
}

const LabelsContext = createContext<TourLabels>(defaultLabels)

export const LabelsProvider = LabelsContext.Provider

export function useTourLabels(): TourLabels {
  return useContext(LabelsContext)
}
