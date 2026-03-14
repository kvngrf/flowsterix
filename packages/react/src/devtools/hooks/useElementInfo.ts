import { useCallback } from 'react'
import type { ElementInfo } from '../types'
import { generateSelector } from '../utils/selectorGenerator'
import { extractSource } from '../utils/sourceExtractor'

export function useElementInfo() {
  const getElementInfo = useCallback(
    async (params: { element: Element }): Promise<ElementInfo> => {
      const { element } = params
      const selectorResult = generateSelector({ element })
      const source = await extractSource({ element })
      const rect = element.getBoundingClientRect()
      const htmlElement = element as HTMLElement
      const styleAttr = htmlElement.getAttribute?.('style') || undefined

      return {
        element,
        url: window.location.href,
        selector: selectorResult.selector,
        selectorType: selectorResult.selectorType,
        suggestedAttrName: selectorResult.suggestedAttrName,
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim().slice(0, 50) || undefined,
        className:
          typeof element.className === 'string'
            ? element.className
            : undefined,
        style: styleAttr,
        existingAttrs: selectorResult.existingAttrs,
        rect,
        source: source ?? undefined,
      }
    },
    []
  )

  return { getElementInfo }
}
