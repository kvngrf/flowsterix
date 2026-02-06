export const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined'

type RectInit = {
  top: number
  left: number
  width: number
  height: number
}

export type ClientRectLike = RectInit & {
  right: number
  bottom: number
}

export const createRect = ({
  top,
  left,
  width,
  height,
}: RectInit): ClientRectLike => ({
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

export const toClientRect = (rect: DOMRect | DOMRectReadOnly): ClientRectLike =>
  createRect({
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  })

export const getViewportRect = (): ClientRectLike => {
  if (!isBrowser) {
    return createRect({ top: 0, left: 0, width: 0, height: 0 })
  }

  const clientWidth = document.documentElement.clientWidth
  const clientHeight = document.documentElement.clientHeight
  const width = clientWidth > 0 ? clientWidth : window.innerWidth
  const height = clientHeight > 0 ? clientHeight : window.innerHeight

  return createRect({
    top: 0,
    left: 0,
    width,
    height,
  })
}

export const expandRect = (
  rect: ClientRectLike,
  padding: number,
): ClientRectLike => {
  if (!isBrowser) return rect

  const viewport = getViewportRect()

  // Calculate available space on each side
  const spaceTop = rect.top
  const spaceBottom = viewport.height - rect.bottom
  const spaceLeft = rect.left
  const spaceRight = viewport.width - rect.right

  // Use the minimum available space on each axis for symmetrical padding
  // Clamp to 0 so padding never goes negative when element extends beyond viewport
  const verticalPadding = Math.max(0, Math.min(padding, spaceTop, spaceBottom))
  const horizontalPadding = Math.max(0, Math.min(padding, spaceLeft, spaceRight))

  return createRect({
    top: rect.top - verticalPadding,
    left: rect.left - horizontalPadding,
    width: rect.width + horizontalPadding * 2,
    height: rect.height + verticalPadding * 2,
  })
}

export const isRectInViewport = (rect: ClientRectLike, margin = 0) => {
  if (!isBrowser) return true

  const viewport = getViewportRect()
  return (
    rect.top >= margin &&
    rect.left >= margin &&
    rect.bottom <= viewport.height - margin &&
    rect.right <= viewport.width - margin
  )
}

export const getClientRect = (element: Element): ClientRectLike =>
  toClientRect(element.getBoundingClientRect())

const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/i

const isElementScrollable = (node: Element) => {
  if (!isBrowser) return false
  const style = window.getComputedStyle(node)
  if (style.position === 'fixed') return false
  return (
    SCROLLABLE_OVERFLOW.test(style.overflow) ||
    SCROLLABLE_OVERFLOW.test(style.overflowX) ||
    SCROLLABLE_OVERFLOW.test(style.overflowY)
  )
}

export const getScrollParents = (element: Element): Array<Element> => {
  if (!isBrowser) return []
  const parents: Array<Element> = []
  const seen = new Set<Element>()

  let current: Element | null = element.parentElement
  while (current && current !== document.documentElement) {
    if (current !== document.body && isElementScrollable(current)) {
      if (!seen.has(current)) {
        parents.push(current)
        seen.add(current)
      }
    }
    current = current.parentElement
  }

  const scrollingElement = document.scrollingElement
  if (
    scrollingElement &&
    scrollingElement instanceof Element &&
    !seen.has(scrollingElement) &&
    isElementScrollable(scrollingElement)
  ) {
    parents.push(scrollingElement)
    seen.add(scrollingElement)
  }

  return parents
}

export const portalHost = () => (isBrowser ? document.body : null)

let cachedMaskSupport: boolean | null = null

const detectMaskSupport = () => {
  if (!isBrowser) return false

  if ('CSS' in window) {
    try {
      if (window.CSS.supports('mask-image', 'linear-gradient(#000,#000)')) {
        return true
      }
      if (
        window.CSS.supports('-webkit-mask-image', 'linear-gradient(#000,#000)')
      ) {
        return true
      }
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.warn('Flowsterix: CSS.supports check failed', error)
      }
    }
  }

  const probe = document.createElement('div')
  return 'maskImage' in probe.style || 'webkitMaskImage' in probe.style
}

export const supportsMasking = () => {
  if (!isBrowser) return false
  if (cachedMaskSupport === null) {
    cachedMaskSupport = detectMaskSupport()
  }
  return cachedMaskSupport
}
