export { TourProvider, useTour, useTourEvents } from './context'
export type {
  DelayAdvanceInfo,
  TourContextValue,
  TourProviderProps,
} from './context'

export { defaultLabels, useTourLabels } from './labels'
export type { TourLabels } from './labels'

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

export { waitForDom } from './adapters/radixDialogHelpers'

export { useRadixTourDialog } from './hooks/useRadixTourDialog'
export type {
  UseRadixTourDialogParams,
  UseRadixTourDialogResult,
} from './hooks/useRadixTourDialog'

export {
  DialogRegistryProvider,
  useDialogRegistry,
  useDialogRegistryOptional,
} from './dialog/DialogRegistryContext'
export type {
  DialogController,
  DialogRegistryContextValue,
} from './dialog/DialogRegistryContext'

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

// Router utilities that don't require external router dependencies
export {
  getCurrentRoutePath,
  notifyRouteChange,
  subscribeToRouteChanges,
} from './router/routeGating'
export { createPathString } from './router/utils'

// TanStack Router - import from '@flowsterix/react/router/tanstack'
// React Router - import from '@flowsterix/react/router/react-router'
// Next.js App Router - import from '@flowsterix/react/router/next-app'
// Next.js Pages Router - import from '@flowsterix/react/router/next-pages'
