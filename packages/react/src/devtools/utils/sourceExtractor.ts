import { resolveSource } from 'element-source'
import type { ElementSource } from '../types'

export async function extractSource(params: {
  element: Element
}): Promise<ElementSource | null> {
  const { element } = params

  if (typeof window === 'undefined') return null

  try {
    const source = await resolveSource(element)
    if (!source) return null

    return {
      fileName: source.filePath,
      lineNumber: source.lineNumber ?? 0,
      columnNumber: source.columnNumber ?? 0,
    }
  } catch {
    return null
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
