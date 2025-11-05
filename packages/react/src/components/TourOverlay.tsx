import { createPortal } from 'react-dom'

import type { TourTargetInfo } from '../hooks/useTourTarget'
import { cn } from '../utils/cn'
import {
  expandRect,
  getViewportRect,
  isBrowser,
  portalHost,
} from '../utils/dom'

export interface TourOverlayProps {
  target: TourTargetInfo
  padding?: number
  radius?: number
  color?: string
  colorClassName?: string
  opacity?: number
  shadow?: string
  shadowClassName?: string
  zIndex?: number
  edgeBuffer?: number
}

export const TourOverlay = ({
  target,
  padding = 12,
  radius = 12,
  color,
  colorClassName = 'bg-slate-900',
  opacity = 0.6,
  shadow,
  shadowClassName,
  zIndex = 1000,
  edgeBuffer = 8,
}: TourOverlayProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const viewport = getViewportRect()
  const highlightRect =
    target.isScreen || !target.rect
      ? viewport
      : expandRect(target.rect, padding)

  const topHeight = Math.max(0, highlightRect.top)
  const bottomHeight = Math.max(
    0,
    viewport.height - (highlightRect.top + highlightRect.height),
  )
  const leftWidth = Math.max(0, highlightRect.left)
  const defaultInsetShadow =
    'inset 0 0 0 2px rgba(56,189,248,0.9), inset 0 0 0 10px rgba(15,23,42,0.35)'
  const layerClass = cn(
    'fixed pointer-events-auto transition-[transform,width,height] duration-[120ms] ease-linear',
    color ? null : colorClassName,
  )
  const highlightClass = cn(
    'fixed pointer-events-none transition-[transform,width,height] duration-[120ms] ease-linear',
    shadow ? null : shadowClassName,
  )
  const layerAppearance = color
    ? { backgroundColor: color, opacity }
    : { opacity }
  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : shadowClassName
      ? undefined
      : { boxShadow: defaultInsetShadow }
  const insetTop = highlightRect.top <= 0 ? edgeBuffer : 0
  const insetLeft = highlightRect.left <= 0 ? edgeBuffer : 0
  const insetBottom =
    highlightRect.top + highlightRect.height >= viewport.height ? edgeBuffer : 0
  const insetRight =
    highlightRect.left + highlightRect.width >= viewport.width ? edgeBuffer : 0
  const insetWidth = highlightRect.width - insetLeft - insetRight
  const insetHeight = highlightRect.height - insetTop - insetBottom
  const hasValidInset = insetWidth > 0 && insetHeight > 0
  const highlightTop = hasValidInset
    ? highlightRect.top + insetTop
    : highlightRect.top
  const highlightLeft = hasValidInset
    ? highlightRect.left + insetLeft
    : highlightRect.left
  const highlightWidth = hasValidInset
    ? insetWidth
    : Math.max(0, highlightRect.width)
  const highlightHeight = hasValidInset
    ? insetHeight
    : Math.max(0, highlightRect.height)

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      aria-hidden={target.status !== 'ready'}
    >
      <div
        className={layerClass}
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: topHeight,
          ...layerAppearance,
        }}
      />
      <div
        className={layerClass}
        style={{
          top: highlightRect.top,
          left: 0,
          width: leftWidth,
          height: Math.max(0, highlightRect.height),
          ...layerAppearance,
        }}
      />
      <div
        className={layerClass}
        style={{
          top: highlightRect.top,
          left: highlightRect.left + highlightRect.width,
          right: 0,
          height: Math.max(0, highlightRect.height),
          ...layerAppearance,
        }}
      />
      <div
        className={layerClass}
        style={{
          top: highlightRect.top + highlightRect.height,
          left: 0,
          right: 0,
          height: bottomHeight,
          ...layerAppearance,
        }}
      />
      <div
        className={highlightClass}
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: Math.max(0, highlightWidth),
          height: Math.max(0, highlightHeight),
          borderRadius: radius,
          ...highlightAppearance,
        }}
      />
    </div>,
    host,
  )
}
