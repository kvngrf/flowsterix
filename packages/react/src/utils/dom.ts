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
  const top = Math.max(0, rect.top - padding)
  const left = Math.max(0, rect.left - padding)
  const width = Math.min(viewport.width - left, rect.width + padding * 2)
  const height = Math.min(viewport.height - top, rect.height + padding * 2)

  return createRect({
    top,
    left,
    width: Math.max(0, width),
    height: Math.max(0, height),
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

export const portalHost = () => (isBrowser ? document.body : null)
