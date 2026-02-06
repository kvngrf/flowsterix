import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { DevToolsExport, ElementInfo, GrabbedStep } from '../types'
import { clearSteps, loadSteps, saveSteps } from '../utils/storage'

interface StepStore {
  steps: GrabbedStep[]
  listeners: Set<() => void>
}

const store: StepStore = {
  steps: [],
  listeners: new Set(),
}

function notifyListeners() {
  for (const listener of store.listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener)
  return () => store.listeners.delete(listener)
}

function getSnapshot(): GrabbedStep[] {
  return store.steps
}

const SERVER_SNAPSHOT: GrabbedStep[] = []

function getServerSnapshot(): GrabbedStep[] {
  return SERVER_SNAPSHOT
}

function generateId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export interface UseStepStoreResult {
  steps: GrabbedStep[]
  addStep: (params: { info: ElementInfo }) => GrabbedStep
  removeStep: (params: { id: string }) => void
  updateStep: (params: { id: string; updates: Partial<GrabbedStep> }) => void
  reorderSteps: (params: { fromIndex: number; toIndex: number }) => void
  clearAllSteps: () => void
  exportSteps: () => DevToolsExport
}

export function useStepStore(): UseStepStoreResult {
  const steps = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadSteps()
    if (saved.length > 0) {
      store.steps = saved
      notifyListeners()
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    saveSteps(steps)
  }, [steps])

  const addStep = useCallback((params: { info: ElementInfo }): GrabbedStep => {
    const { info } = params
    const newStep: GrabbedStep = {
      id: generateId(),
      order: store.steps.length,
      selector: info.selector,
      selectorType: info.selectorType,
      elementTag: info.tag,
      elementText: info.text,
      elementClassName: info.className,
      elementStyle: info.style,
      existingAttrs: info.existingAttrs,
      suggestedAttrName: info.suggestedAttrName,
      componentHierarchy: info.componentHierarchy,
      rect: {
        top: info.rect.top,
        left: info.rect.left,
        width: info.rect.width,
        height: info.rect.height,
      },
      source: info.source,
      createdAt: Date.now(),
    }

    store.steps = [...store.steps, newStep]
    notifyListeners()
    return newStep
  }, [])

  const removeStep = useCallback((params: { id: string }) => {
    const { id } = params
    store.steps = store.steps
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }))
    notifyListeners()
  }, [])

  const updateStep = useCallback(
    (params: { id: string; updates: Partial<GrabbedStep> }) => {
      const { id, updates } = params
      store.steps = store.steps.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      )
      notifyListeners()
    },
    []
  )

  const reorderSteps = useCallback(
    (params: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = params
      const newSteps = [...store.steps]
      const [removed] = newSteps.splice(fromIndex, 1)
      newSteps.splice(toIndex, 0, removed)
      store.steps = newSteps.map((s, i) => ({ ...s, order: i }))
      notifyListeners()
    },
    []
  )

  const clearAllSteps = useCallback(() => {
    store.steps = []
    clearSteps()
    notifyListeners()
  }, [])

  const exportSteps = useCallback((): DevToolsExport => {
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      steps: store.steps.map((step) => {
        // Format element like: <button class="btn" type="button">Click me</button>
        let elementStr = `<${step.elementTag}`
        if (step.elementClassName) {
          elementStr += ` class="${step.elementClassName.slice(0, 60)}${step.elementClassName.length > 60 ? '...' : ''}"`
        }
        if (step.elementStyle) {
          elementStr += ` style="${step.elementStyle.slice(0, 40)}${step.elementStyle.length > 40 ? '...' : ''}"`
        }
        for (const attr of step.existingAttrs) {
          if (attr !== 'class' && attr !== 'style') {
            elementStr += ` ${attr}`
          }
        }
        elementStr += '>'
        if (step.elementText) {
          elementStr += `${step.elementText.slice(0, 30)}${step.elementText.length > 30 ? '...' : ''}`
        }
        elementStr += `</${step.elementTag}>`

        // Format source like: src/components/Button.tsx:45
        const sourceStr = step.source
          ? `${step.source.fileName.replace(/^.*\/src\//, 'src/')}:${step.source.lineNumber}`
          : undefined

        return {
          order: step.order,
          element: elementStr,
          componentTree: step.componentHierarchy,
          source: sourceStr,
        }
      }),
    }
  }, [])

  return {
    steps,
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    clearAllSteps,
    exportSteps,
  }
}
