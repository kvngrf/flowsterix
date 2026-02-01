import { useCallback } from 'react'
import type { ElementInfo } from '../types'
import { generateSelector } from '../utils/selectorGenerator'
import { extractComponentHierarchy, extractSource } from '../utils/sourceExtractor'

export function useElementInfo() {
  const getElementInfo = useCallback((params: { element: Element }): ElementInfo => {
    const { element } = params
    const selectorResult = generateSelector({ element })
    const source = extractSource({ element })
    const componentHierarchy = extractComponentHierarchy({ element })
    const rect = element.getBoundingClientRect()
    const htmlElement = element as HTMLElement
    const styleAttr = htmlElement.getAttribute?.('style') || undefined

    return {
      element,
      selector: selectorResult.selector,
      selectorType: selectorResult.selectorType,
      suggestedAttrName: selectorResult.suggestedAttrName,
      tag: element.tagName.toLowerCase(),
      text: element.textContent?.trim().slice(0, 50) || undefined,
      className:
        typeof element.className === 'string' ? element.className : undefined,
      style: styleAttr,
      existingAttrs: selectorResult.existingAttrs,
      componentHierarchy,
      rect,
      source: source ?? undefined,
    }
  }, [])

  return { getElementInfo }
}
