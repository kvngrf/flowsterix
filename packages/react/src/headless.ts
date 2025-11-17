export { TourProvider, useTour, useTourEvents } from './context'
export type {
  DelayAdvanceInfo,
  TourContextValue,
  TourProviderProps,
} from './context'

export { useTourTarget } from './hooks/useTourTarget'
export type { TourTargetInfo } from './hooks/useTourTarget'

export { useTourControls } from './hooks/useTourControls'
export type { TourControlsState } from './hooks/useTourControls'

export { useDelayAdvance } from './hooks/useDelayAdvance'
export type { DelayAdvanceProgress } from './hooks/useDelayAdvance'

export { useAdvanceRules } from './hooks/useAdvanceRules'
export { useBodyScrollLock } from './hooks/useBodyScrollLock'
export {
  useHiddenTargetFallback,
} from './hooks/useHiddenTargetFallback'
export type {
  UseHiddenTargetFallbackConfig,
  UseHiddenTargetFallbackResult,
} from './hooks/useHiddenTargetFallback'
export { useViewportRect } from './hooks/useViewportRect'

export { createWaitForPredicateController } from './hooks/waitForPredicate'
export type {
  WaitForPredicateController,
  WaitForPredicateControllerOptions,
} from './hooks/waitForPredicate'

export {
  AnimationAdapterProvider,
  defaultAnimationAdapter,
  reducedMotionAnimationAdapter,
  useAnimationAdapter,
  usePreferredAnimationAdapter,
} from './motion/animationAdapter'
export type {
  AnimationAdapter,
  AnimationAdapterComponents,
  AnimationAdapterProviderProps,
  AnimationAdapterTransitions,
  UseAnimationAdapterOptions,
} from './motion/animationAdapter'

export {
  cssVar,
  defaultTokens,
  isTourTokenPath,
  mergeTokens,
  tokenPathToCssVar,
} from './theme/tokens'
export type {
  TourTokenPath,
  TourTokens,
  TourTokensOverride,
} from './theme/tokens'
export { TokensProvider, useTourTokens } from './theme/TokensProvider'

export {
  createPathString,
  getCurrentRoutePath,
  getTanStackRouter,
  getTourRouter,
  notifyRouteChange,
  setTanStackRouter,
  setTourRouter,
  subscribeToRouteChanges,
  TanStackRouterSync,
  useTanStackRouterTourAdapter,
} from './router'
