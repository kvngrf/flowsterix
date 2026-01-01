'use client'

import type { FlowDefinition } from '@flowsterix/core'
import { TourProvider as HeadlessTourProvider } from '@flowsterix/headless'
import * as React from 'react'

export interface TourProviderProps {
  /** Array of flow definitions to register */
  flows: FlowDefinition<React.ReactNode>[]
  /** Storage namespace for persistence (default: "flowsterix") */
  storageNamespace?: string
  /** Whether to persist tour progress (default: true) */
  persistOnChange?: boolean
  /** Enable debug mode overlay (default: false in production) */
  debug?: boolean
  children: React.ReactNode
}

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
  flows,
  storageNamespace = 'flowsterix',
  persistOnChange = true,
  debug = false,
  children,
}: TourProviderProps) {
  return (
    <HeadlessTourProvider
      flows={flows}
      storageNamespace={storageNamespace}
      persistOnChange={persistOnChange}
      defaultDebug={debug}
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
