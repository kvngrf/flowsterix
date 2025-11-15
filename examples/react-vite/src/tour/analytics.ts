import type { FlowAnalyticsHandlers } from '@tour/core'
import type { ReactNode } from 'react'

type AnalyticsLevel = 'info' | 'warn' | 'error'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

const logEvent = (level: AnalyticsLevel, event: string, payload: unknown) => {
  const namespace = `[tour][demo][analytics] ${event}`
  const logger =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  logger(namespace, payload)
}

const pushToDataLayer = (event: string, payload: unknown) => {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({
    event: `tour:${event}`,
    payload,
    timestamp: Date.now(),
  })
}

const track = (
  event: string,
  payload: unknown,
  level: AnalyticsLevel = 'info',
) => {
  logEvent(level, event, payload)
  pushToDataLayer(event, payload)
}

export const demoAnalytics: FlowAnalyticsHandlers<ReactNode> = {
  onFlowStart: (payload) => track('flowStart', payload),
  onFlowResume: (payload) => track('flowResume', payload),
  onFlowPause: (payload) => track('flowPause', payload),
  onFlowComplete: (payload) => track('flowComplete', payload),
  onFlowCancel: (payload) => track('flowCancel', payload, 'warn'),
  onStepEnter: (payload) => track('stepEnter', payload),
  onStepExit: (payload) => track('stepExit', payload),
  onStepComplete: (payload) => track('stepComplete', payload),
  onFlowError: (payload) => track('flowError', payload, 'error'),
}
