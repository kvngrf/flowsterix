import type { FlowIntegration } from '@flowsterix/core'
import { studioIntegration } from '@flowsterix/studio'

let integration: FlowIntegration | null = null

export function getStudioIntegration(): FlowIntegration | null {
  if (typeof window === 'undefined') return null
  if (integration) return integration

  const apiKey = process.env.NEXT_PUBLIC_FLOWSTERIX_STUDIO_API_KEY
  const endpoint = process.env.NEXT_PUBLIC_FLOWSTERIX_STUDIO_ENDPOINT

  if (!apiKey) return null

  integration = studioIntegration({
    apiKey,
    ...(endpoint && { endpoint }),
  })

  return integration
}
