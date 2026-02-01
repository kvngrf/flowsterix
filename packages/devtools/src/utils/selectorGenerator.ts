interface SelectorResult {
  selector: string
  selectorType: 'auto' | 'data-attr' | 'custom'
  suggestedAttrName: string
  existingAttrs: string[]
}

function generateSemanticName(element: Element): string {
  const tag = element.tagName.toLowerCase()
  const text = element.textContent?.trim().slice(0, 20).toLowerCase() || ''
  const className = element.className
  const id = element.id

  // Try to generate from text content
  if (text) {
    const words = text
      .replace(/[^a-z0-9\s]/gi, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
    if (words.length > 0) {
      return `${tag}-${words.join('-')}`
    }
  }

  // Try from id
  if (id) {
    return id
  }

  // Try from class
  if (typeof className === 'string' && className) {
    const firstClass = className.split(/\s+/)[0]
    if (firstClass && !firstClass.startsWith('_') && firstClass.length < 30) {
      return `${tag}-${firstClass}`
    }
  }

  // Fall back to tag + random suffix
  return `${tag}-${Math.random().toString(36).slice(2, 6)}`
}

function getExistingDataAttrs(element: Element): string[] {
  const attrs: string[] = []
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-')) {
      attrs.push(attr.name)
    }
  }
  return attrs
}

function isUnique(params: { selector: string }): boolean {
  try {
    return document.querySelectorAll(params.selector).length === 1
  } catch {
    return false
  }
}

export function generateSelector(params: { element: Element }): SelectorResult {
  const { element } = params
  const existingAttrs = getExistingDataAttrs(element)

  // Priority 1: data-tour-target
  const tourTarget = element.getAttribute('data-tour-target')
  if (tourTarget) {
    return {
      selector: `[data-tour-target="${tourTarget}"]`,
      selectorType: 'data-attr',
      suggestedAttrName: tourTarget,
      existingAttrs,
    }
  }

  // Priority 2: id attribute
  if (element.id && isUnique({ selector: `#${CSS.escape(element.id)}` })) {
    return {
      selector: `#${CSS.escape(element.id)}`,
      selectorType: 'auto',
      suggestedAttrName: element.id,
      existingAttrs,
    }
  }

  // Priority 3: data-testid
  const testId = element.getAttribute('data-testid')
  if (testId && isUnique({ selector: `[data-testid="${testId}"]` })) {
    return {
      selector: `[data-testid="${testId}"]`,
      selectorType: 'data-attr',
      suggestedAttrName: testId,
      existingAttrs,
    }
  }

  // Priority 4: Other unique data-* attributes
  for (const attr of existingAttrs) {
    if (attr === 'data-tour-target' || attr === 'data-testid') continue
    const value = element.getAttribute(attr)
    if (value) {
      const selector = `[${attr}="${value}"]`
      if (isUnique({ selector })) {
        return {
          selector,
          selectorType: 'data-attr',
          suggestedAttrName: value,
          existingAttrs,
        }
      }
    }
  }

  // Priority 5: Generate suggested data-tour-target
  const suggestedName = generateSemanticName(element)
  return {
    selector: `[data-tour-target="${suggestedName}"]`,
    selectorType: 'auto',
    suggestedAttrName: suggestedName,
    existingAttrs,
  }
}
