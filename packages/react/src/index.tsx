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

export { useHudAppearance } from './hooks/useHudAppearance'
export type {
  HudPopoverProps,
  UseHudAppearanceOptions,
  UseHudAppearanceResult,
} from './hooks/useHudAppearance'

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

export { useDelayAdvance } from './hooks/useDelayAdvance'
export type { DelayAdvanceProgress } from './hooks/useDelayAdvance'

export { TourOverlay } from './components/TourOverlay'
export type { TourOverlayProps } from './components/TourOverlay'

export { OverlayBackdrop } from './components/OverlayBackdrop'
export type {
  OverlayBackdropProps,
  OverlayBackdropTransitionsOverride,
} from './components/OverlayBackdrop'

export { TourPopover, TourPopoverPortal } from './components/TourPopover'
export type {
  TourPopoverLayoutMode,
  TourPopoverPortalProps,
  TourPopoverPortalRenderProps,
  TourPopoverProps,
} from './components/TourPopover'

export { DelayProgressBar } from './components/DelayProgressBar'
export type { DelayProgressBarProps } from './components/DelayProgressBar'

export { TourControls } from './components/TourControls'
export type { TourControlsProps } from './components/TourControls'

export { TourHUD } from './components/TourHUD'
export type { TourHUDProps, TourHUDRenderContext } from './components/TourHUD'

export { TourRenderer } from './components/TourRenderer'
export type { TourRendererProps } from './components/TourRenderer'

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
