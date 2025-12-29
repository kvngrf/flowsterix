import { useTour } from '../context'

export interface UseTourFocusDominanceOptions {
  enabled?: boolean
}

export interface UseTourFocusDominanceResult {
  active: boolean
  suspendExternalFocusTrap: boolean
}

const DEFAULT_ENABLED = true

export const useTourFocusDominance = (
  options: UseTourFocusDominanceOptions = {},
): UseTourFocusDominanceResult => {
  const { enabled = DEFAULT_ENABLED } = options
  const { state } = useTour()
  const isRunning = state?.status === 'running'
  const active = Boolean(enabled && isRunning)

  return {
    active,
    suspendExternalFocusTrap: active,
  }
}
