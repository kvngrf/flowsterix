import type { GrabbedStep } from '../types'

const STORAGE_KEY = 'flowsterix-devtools-steps'

function migrateStep(step: Partial<GrabbedStep>): GrabbedStep {
  return {
    ...step,
    componentHierarchy: step.componentHierarchy ?? [],
    existingAttrs: step.existingAttrs ?? [],
  } as GrabbedStep
}

export function loadSteps(): GrabbedStep[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []
    return parsed.map(migrateStep)
  } catch {
    return []
  }
}

export function saveSteps(steps: GrabbedStep[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps))
  } catch {
    // Storage full or disabled
  }
}

export function clearSteps(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}
