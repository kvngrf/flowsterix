import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence, motion } from 'motion/react'
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
  blurAmount?: number
}

export const TourOverlay = ({
  target,
  padding = 12,
  radius = 12,
  color,
  colorClassName = 'bg-slate-900/60',
  opacity = 1,
  shadow,
  shadowClassName,
  zIndex = 1000,
  edgeBuffer = 8,
  blurAmount = 4,
}: TourOverlayProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const hasShownRef = useRef(false)
  const lastReadyTargetRef = useRef<TourTargetInfo | null>(null)

  useEffect(() => {
    if (target.status === 'ready') {
      hasShownRef.current = true
      lastReadyTargetRef.current = {
        ...target,
        rect: target.rect ? { ...target.rect } : null,
      }
    }
    if (target.status === 'idle') {
      hasShownRef.current = false
      lastReadyTargetRef.current = null
    }
  }, [target])

  const viewport = getViewportRect()

  const cachedTarget = lastReadyTargetRef.current
  const highlightTarget = target.status === 'ready' ? target : cachedTarget

  const resolvedRect = highlightTarget?.rect ?? target.rect
  const resolvedIsScreen = highlightTarget?.isScreen ?? target.isScreen

  const expandedRect =
    resolvedIsScreen || !resolvedRect
      ? viewport
      : expandRect(resolvedRect, padding)
  const safeBuffer = Math.max(0, edgeBuffer)

  const insetTop =
    expandedRect.top <= 0
      ? Math.min(safeBuffer, Math.max(0, expandedRect.height) / 2)
      : 0
  const insetLeft =
    expandedRect.left <= 0
      ? Math.min(safeBuffer, Math.max(0, expandedRect.width) / 2)
      : 0
  const insetBottom =
    expandedRect.top + expandedRect.height >= viewport.height
      ? Math.min(safeBuffer, Math.max(0, expandedRect.height) / 2)
      : 0
  const insetRight =
    expandedRect.left + expandedRect.width >= viewport.width
      ? Math.min(safeBuffer, Math.max(0, expandedRect.width) / 2)
      : 0

  const highlightTop = expandedRect.top + insetTop
  const highlightLeft = expandedRect.left + insetLeft
  const highlightWidth = Math.max(
    0,
    expandedRect.width - insetLeft - insetRight,
  )
  const highlightHeight = Math.max(
    0,
    expandedRect.height - insetTop - insetBottom,
  )
  const highlightRadius = Math.max(
    0,
    Math.min(radius, highlightWidth / 2, highlightHeight / 2),
  )

  const highlightCenterX = highlightLeft + highlightWidth / 2
  const highlightCenterY = highlightTop + highlightHeight / 2

  const shouldMask =
    !!highlightTarget &&
    !resolvedIsScreen &&
    highlightWidth > 0 &&
    highlightHeight > 0

  const maskId = useMemo(
    () => `tour-overlay-mask-${Math.random().toString(36).slice(2, 10)}`,
    [],
  )

  const maskUrl = shouldMask ? `url(#${maskId})` : undefined

  const isActive =
    target.status === 'ready' ||
    (target.status === 'resolving' && cachedTarget !== null)

  const overlayClassName = cn(
    'pointer-events-none absolute origin-center inset-0',
    '[mask-mode:luminance]',
    '[mask-repeat:no-repeat]',
    '[mask-size:100%_100%]',
    color ? null : colorClassName,
  )
  const ringClassName = cn(
    'pointer-events-none absolute orirgin-center',
    shadow ? null : shadowClassName,
  )

  const defaultInsetShadow =
    'inset 0 0 0 2px rgba(56,189,248,0.4), inset 0 0 0 8px rgba(15,23,42,0.3)'

  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : shadowClassName
      ? undefined
      : { boxShadow: defaultInsetShadow }

  const highlightTransition = {
    duration: 0.35,
    ease: 'easeOut' as const,
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
    mass: 0.7,
  }

  const overlayTransition = {
    duration: 0.35,
    ease: 'easeOut' as const,
  }

  const highlightRectAnimation = shouldMask
    ? {
        x: highlightLeft,
        y: highlightTop,
        width: highlightWidth,
        height: highlightHeight,
        rx: highlightRadius,
        ry: highlightRadius,
      }
    : {
        x: highlightCenterX,
        y: highlightCenterY,
        width: 0,
        height: 0,
        rx: 0,
        ry: 0,
      }

  const highlightRingAnimation = shouldMask
    ? {
        top: highlightCenterY,
        left: highlightCenterX,
        width: highlightWidth,
        height: highlightHeight,
        borderRadius: highlightRadius,
        opacity: 1,
        transform: 'translate(-50%, -50%)',
      }
    : {
        top: highlightCenterY,
        left: highlightCenterX,
        width: 0,
        height: 0,
        borderRadius: 0,
        opacity: 0,
        transform: 'translate(-50%, -50%)',
      }

  const blurValue = blurAmount > 0 ? `${blurAmount}px` : '0px'

  const overlayStyle: CSSProperties = {
    zIndex,
    backdropFilter: 'blur(var(--tour-overlay-blur, 0px))',
    WebkitBackdropFilter: 'blur(var(--tour-overlay-blur, 0px))',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  }

  if (maskUrl) {
    overlayStyle.mask = maskUrl
    overlayStyle.WebkitMask = maskUrl
  }

  if (color) {
    overlayStyle.backgroundColor = color
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      aria-hidden={target.status !== 'ready'}
    >
      <AnimatePresence mode="popLayout">
        {shouldMask ? (
          <motion.svg
            key="tour-mask"
            width="0"
            height="0"
            aria-hidden
            focusable="false"
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          >
            <motion.defs>
              <motion.mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
                x="0"
                y="0"
                animate={{ width: viewport.width, height: viewport.height }}
                transition={highlightTransition}
              >
                <motion.rect
                  x="0"
                  y="0"
                  animate={{
                    width: viewport.width,
                    height: viewport.height,
                  }}
                  fill="white"
                  transition={highlightTransition}
                  exit={{ opacity: 0 }}
                />
                <motion.rect
                  initial={false}
                  animate={highlightRectAnimation}
                  exit={{
                    x: highlightCenterX,
                    y: highlightCenterY,
                  }}
                  transition={highlightTransition}
                  fill="black"
                />
              </motion.mask>
            </motion.defs>
          </motion.svg>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {isActive ? (
          <motion.div
            key="tour-overlay"
            className={overlayClassName || undefined}
            style={overlayStyle}
            initial={{
              opacity: 0,
              '--tour-overlay-blur': '0px',
              transition: overlayTransition,
            }}
            animate={{
              opacity,
              '--tour-overlay-blur': blurValue,
            }}
            exit={{ opacity: 0, '--tour-overlay-blur': '0px' }}
            transition={overlayTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {isActive && shouldMask ? (
          <motion.div
            key="tour-ring"
            className={ringClassName || undefined}
            style={{
              position: 'absolute',
              zIndex: zIndex + 1,
              ...highlightAppearance,
            }}
            initial={false}
            animate={highlightRingAnimation}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.35,
                ease: 'easeOut',
              },
            }}
            transition={highlightTransition}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>,
    host,
  )
}
