import type { ElementSource } from '../types'

interface FiberNode {
  _debugSource?: {
    fileName: string
    lineNumber: number
    columnNumber?: number
  }
  return?: FiberNode
  child?: FiberNode
  sibling?: FiberNode
  stateNode?: Element | null
  tag?: number
  type?: string | { name?: string; displayName?: string } | null
  elementType?: { name?: string; displayName?: string } | null
}

interface ReactDevToolsHook {
  renderers: Map<
    number,
    {
      findFiberByHostInstance?: (instance: Element) => FiberNode | null
    }
  >
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook
  }
}

function getReactFiber(element: Element): FiberNode | null {
  // Method 1: Use React DevTools hook if available
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  if (hook?.renderers) {
    for (const renderer of hook.renderers.values()) {
      if (renderer.findFiberByHostInstance) {
        const fiber = renderer.findFiberByHostInstance(element)
        if (fiber) return fiber
      }
    }
  }

  // Method 2: Access fiber directly from element properties
  const keys = Object.keys(element)
  for (const key of keys) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return (element as unknown as Record<string, FiberNode>)[key]
    }
  }

  return null
}

function getFiberName(fiber: FiberNode): string | null {
  // Get component name from fiber
  const type = fiber.type || fiber.elementType
  if (!type) return null

  if (typeof type === 'string') {
    return type // Native element like 'div', 'button'
  }

  if (typeof type === 'object') {
    return type.displayName || type.name || null
  }

  if (typeof type === 'function') {
    return (type as { displayName?: string; name?: string }).displayName ||
           (type as { displayName?: string; name?: string }).name || null
  }

  return null
}

function findDebugSource(fiber: FiberNode | null): ElementSource | null {
  let current = fiber
  let depth = 0
  const maxDepth = 50

  while (current && depth < maxDepth) {
    if (current._debugSource) {
      const source = current._debugSource
      return {
        fileName: source.fileName,
        lineNumber: source.lineNumber,
        columnNumber: source.columnNumber ?? 0,
      }
    }
    current = current.return ?? null
    depth++
  }

  return null
}

export function extractSource(params: { element: Element }): ElementSource | null {
  const { element } = params

  if (typeof window === 'undefined') return null

  try {
    const fiber = getReactFiber(element)
    if (!fiber) return null
    return findDebugSource(fiber)
  } catch {
    return null
  }
}

export function extractComponentHierarchy(params: { element: Element }): string[] {
  const { element } = params
  const hierarchy: string[] = []

  if (typeof window === 'undefined') return hierarchy

  try {
    const fiber = getReactFiber(element)
    if (!fiber) return hierarchy

    let current: FiberNode | null = fiber
    let depth = 0
    const maxDepth = 20

    while (current && depth < maxDepth) {
      const name = getFiberName(current)
      if (name && !hierarchy.includes(name)) {
        hierarchy.push(name)
      }
      current = current.return ?? null
      depth++
    }

    return hierarchy
  } catch {
    return hierarchy
  }
}

export function formatSourcePath(params: { source: ElementSource }): string {
  const { source } = params
  const fileName = source.fileName.replace(/^.*\/src\//, 'src/')
  return `${fileName}:${source.lineNumber}`
}

export function getVSCodeLink(params: { source: ElementSource }): string {
  const { source } = params
  return `vscode://file${source.fileName}:${source.lineNumber}:${source.columnNumber}`
}
