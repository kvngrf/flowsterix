const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [contenteditable="true"], [tabindex]'

const isElementVisible = (element: HTMLElement) => {
  if (element.offsetParent !== null) return true
  if (element.getClientRects().length > 0) return true
  return false
}

export const isFocusableElement = (
  element: Element | null,
): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) return false
  if (element.hasAttribute('disabled')) return false
  if (element.getAttribute('aria-hidden') === 'true') return false
  if (element.tabIndex >= 0) return true
  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input') {
    const type = element.getAttribute('type')
    if (type === 'hidden') return false
    return !element.hasAttribute('disabled')
  }
  if (tagName === 'button' || tagName === 'select' || tagName === 'textarea') {
    return !element.hasAttribute('disabled')
  }
  if (tagName === 'a' || tagName === 'area') {
    return element.hasAttribute('href')
  }
  if (element.hasAttribute('contenteditable')) {
    return element.getAttribute('contenteditable') !== 'false'
  }
  if (!element.hasAttribute('tabindex')) return false
  return element.tabIndex >= 0
}

export const getFocusableIn = (
  root: Element | Document | null,
): Array<HTMLElement> => {
  if (!root) return []
  const scope = root instanceof Document ? root.body : root
  const matched = Array.from(
    scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  )
  const results: Array<HTMLElement> = []
  const seen = new Set<HTMLElement>()
  for (const element of matched) {
    if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) continue
    if (!isElementVisible(element)) continue
    if (!isFocusableElement(element)) continue
    if (element.closest('[data-tour-focus-skip="true"]')) continue
    if (seen.has(element)) continue
    seen.add(element)
    results.push(element)
  }
  return results
}

export const focusElement = (
  element: HTMLElement | null | undefined,
  options?: FocusOptions,
) => {
  if (!element) return
  try {
    element.focus(options ?? { preventScroll: true })
  } catch {
    // Ignore focus errors (detached nodes or legacy browsers).
  }
}
