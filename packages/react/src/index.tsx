export { TourProvider, useTour, useTourEvents } from './context'
export type {
  DelayAdvanceInfo,
  TourContextValue,
  TourProviderProps,
} from './context'

export { useTourTarget } from './hooks/useTourTarget'
export type { TourTargetInfo } from './hooks/useTourTarget'

export { useHudState } from './hooks/useHudState'
export type { UseHudStateOptions, UseHudStateResult } from './hooks/useHudState'

export { useHudDescription } from './hooks/useHudDescription'
export type {
  UseHudDescriptionOptions,
  UseHudDescriptionResult,
} from './hooks/useHudDescription'

export { useHudShortcuts } from './hooks/useHudShortcuts'
export type { UseHudShortcutsOptions } from './hooks/useHudShortcuts'

export { useTourHud } from './hooks/useTourHud'
export type {
  TourHudDescription,
  TourHudFocusManagerState,
  TourHudOverlayConfig,
  TourHudPopoverConfig,
  UseTourHudOptions,
  UseTourHudResult,
} from './hooks/useTourHud'

export { useTourOverlay } from './hooks/useTourOverlay'
export type {
  TourOverlayRect,
  TourOverlaySegment,
  UseTourOverlayOptions,
  UseTourOverlayResult,
} from './hooks/useTourOverlay'

export { useHudTargetIssue } from './hooks/useHudTargetIssue'
export type {
  HudTargetIssue,
  UseHudTargetIssueOptions,
  UseHudTargetIssueResult,
} from './hooks/useHudTargetIssue'

export { useRadixDialogAdapter } from './adapters/radixDialog'
export type {
  RadixDialogAdapterResult,
  UseRadixDialogAdapterOptions,
} from './adapters/radixDialog'

export { useTourFocusDominance } from './hooks/useTourFocusDominance'
export type {
  UseTourFocusDominanceOptions,
  UseTourFocusDominanceResult,
} from './hooks/useTourFocusDominance'

export { useTourControls } from './hooks/useTourControls'
export type { TourControlsState } from './hooks/useTourControls'

export { useDelayAdvance } from './hooks/useDelayAdvance'
export type { DelayAdvanceProgress } from './hooks/useDelayAdvance'

export { OverlayBackdrop } from './components/OverlayBackdrop'
export type {
  OverlayBackdropProps,
  OverlayBackdropTransitionsOverride,
} from './components/OverlayBackdrop'

export { TourPopoverPortal } from './components/TourPopoverPortal'
export type {
  TourPopoverLayoutMode,
  TourPopoverPortalProps,
  TourPopoverPortalRenderProps,
} from './components/TourPopoverPortal'

export { TourFocusManager } from './components/TourFocusManager'
export type { TourFocusManagerProps } from './components/TourFocusManager'

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

export { useHudMotion } from './motion/useHudMotion'
export type { UseHudMotionResult } from './motion/useHudMotion'

export { useAdvanceRules } from './hooks/useAdvanceRules'
export { useBodyScrollLock } from './hooks/useBodyScrollLock'
export { useHiddenTargetFallback } from './hooks/useHiddenTargetFallback'
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
