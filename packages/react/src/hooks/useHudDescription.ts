import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

const sanitizeForId = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized.length > 0 ? normalized : 'step'
}

export interface UseHudDescriptionOptions {
  step: Step<ReactNode> | null
  fallbackAriaDescribedBy?: string
}

export interface UseHudDescriptionResult {
  targetDescription: string | null
  descriptionId?: string
  combinedAriaDescribedBy?: string
}

export const useHudDescription = (
  options: UseHudDescriptionOptions,
): UseHudDescriptionResult => {
  const { step, fallbackAriaDescribedBy } = options

  const targetDescription = useMemo(() => {
    if (!step) return null
    if (typeof step.target !== 'object') return null
    const description = step.target.description
    return typeof description === 'string' ? description : null
  }, [step])

  const descriptionId = useMemo(() => {
    if (!step || !targetDescription) return undefined
    return `tour-step-${sanitizeForId(step.id)}-description`
  }, [step, targetDescription])

  const combinedAriaDescribedBy = useMemo(() => {
    const parts = [fallbackAriaDescribedBy, descriptionId].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : undefined
  }, [descriptionId, fallbackAriaDescribedBy])

  return {
    targetDescription,
    descriptionId,
    combinedAriaDescribedBy,
  }
}
