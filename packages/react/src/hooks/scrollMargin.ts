export type ScrollMarginInput =
  | number
  | {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }

export interface ScrollMargin {
  top: number
  bottom: number
  left: number
  right: number
}

export const DEFAULT_SCROLL_MARGIN = 16

const sanitize = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }
  return value < 0 ? 0 : value
}

export const resolveScrollMargin = (
  margin?: ScrollMarginInput,
  fallback = DEFAULT_SCROLL_MARGIN,
): ScrollMargin => {
  if (typeof margin === 'number') {
    const safe = sanitize(margin, fallback)
    return {
      top: safe,
      bottom: safe,
      left: safe,
      right: safe,
    }
  }

  return {
    top: sanitize(margin?.top, fallback),
    bottom: sanitize(margin?.bottom, fallback),
    left: sanitize(margin?.left, fallback),
    right: sanitize(margin?.right, fallback),
  }
}
