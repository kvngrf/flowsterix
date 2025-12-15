import type { ReactNode } from 'react'

import type { FlowState, Step } from '@flowsterix/core'
import { useTour } from '../context'

export interface TourRendererProps {
  flowId?: string
  children?: (payload: { step: Step<ReactNode>; state: FlowState }) => ReactNode
  fallback?: ReactNode
}

export const TourRenderer = ({
  flowId,
  children,
  fallback = null,
}: TourRendererProps) => {
  const { activeFlowId, activeStep, state } = useTour()
  const resolvedFlowId = flowId ?? activeFlowId

  if (!resolvedFlowId || !state || !activeStep || state.status !== 'running') {
    return <>{fallback}</>
  }

  if (!children) {
    return null
  }

  return <>{children({ step: activeStep, state })}</>
}
