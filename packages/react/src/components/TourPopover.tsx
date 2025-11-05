import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type { TourTargetInfo } from '../hooks/useTourTarget'
import { cn } from '../utils/cn'
import { getViewportRect, isBrowser, portalHost } from '../utils/dom'

export interface TourPopoverProps {
  target: TourTargetInfo
  children: ReactNode
  offset?: number
  maxWidth?: number
  zIndex?: number
  className?: string
}

export const TourPopover = ({
  target,
  children,
  offset = 16,
  maxWidth = 360,
  zIndex = 1001,
  className,
}: TourPopoverProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const viewport = getViewportRect()
  const rect = target.rect ?? viewport
  const baseTop = target.isScreen
    ? viewport.height / 2
    : rect.top + rect.height + offset
  const top = target.isScreen
    ? viewport.height / 2
    : Math.min(viewport.height - 24, Math.max(24, baseTop))
  const left = target.isScreen ? viewport.width / 2 : rect.left + rect.width / 2
  const baseClass = cn(
    'fixed w-max pointer-events-auto rounded-xl bg-white px-6 py-5 text-slate-900 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.35)] transition-[transform,top,left] duration-[120ms] ease-linear',
    className,
  )

  return createPortal(
    <div
      className={baseClass}
      style={{
        top,
        left,
        transform: target.isScreen
          ? 'translate(-50%, -50%)'
          : 'translate(-50%, 0)',
        zIndex,
        maxWidth,
      }}
      role="dialog"
      aria-live="polite"
    >
      {children}
    </div>,
    host,
  )
}
