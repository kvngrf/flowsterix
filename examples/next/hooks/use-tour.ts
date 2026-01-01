'use client'

/**
 * useTour hook - Access tour state and controls
 *
 * @example
 * ```tsx
 * import { useTour } from "@/components/tour/hooks/use-tour"
 *
 * function MyComponent() {
 *   const { state, activeStep, startFlow, next, back, cancel } = useTour()
 *
 *   return (
 *     <button onClick={() => startFlow("onboarding")}>
 *       Start Tour
 *     </button>
 *   )
 * }
 * ```
 */
export {
  useDelayAdvance,
  useTour,
  useTourControls,
  useTourEvents,
  useTourHud,
  useTourOverlay,
  useTourTarget,
} from '@flowsterix/headless'

export type {
  DelayAdvanceProgress,
  TourContextValue,
  TourControlsState,
  TourTargetInfo,
  UseTourHudResult,
  UseTourOverlayResult,
} from '@flowsterix/headless'
