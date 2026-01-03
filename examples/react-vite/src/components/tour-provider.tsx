'use client'

import type { TourProviderProps as HeadlessTourProviderProps } from '@flowsterix/headless'
import { TourProvider as HeadlessTourProvider } from '@flowsterix/headless'

export type TourProviderProps = HeadlessTourProviderProps

/**
 * Tour provider that wraps your application and manages tour state.
 *
 * @example
 * ```tsx
 * import { TourProvider } from "@/components/tour/tour-provider"
 * import { onboardingFlow } from "@/lib/tours/onboarding"
 *
 * export function App() {
 *   return (
 *     <TourProvider flows={[onboardingFlow]}>
 *       <YourApp />
 *     </TourProvider>
 *   )
 * }
 * ```
 */
export function TourProvider({
  storageNamespace = 'flowsterix',
  persistOnChange = true,
  children,
  ...props
}: TourProviderProps) {
  return (
    <HeadlessTourProvider
      {...props}
      storageNamespace={storageNamespace}
      persistOnChange={persistOnChange}
    >
      {children}
    </HeadlessTourProvider>
  )
}

// Re-export useful types and utilities
export { createFlow } from '@flowsterix/core'
export type {
  AdvanceRule,
  FlowDefinition,
  FlowState,
  Step,
} from '@flowsterix/core'
export { useTour, useTourEvents } from '@flowsterix/headless'
