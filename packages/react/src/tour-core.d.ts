import type { TourTokensOverride } from './theme/tokens'

declare module '@tour/core' {
  interface FlowHudTokenOverrides extends TourTokensOverride {}
}
export {}
