import type { TourTokensOverride } from './theme/tokens'

declare module '@flowsterix/core' {
  interface FlowHudTokenOverrides extends TourTokensOverride {}
}
export {}
