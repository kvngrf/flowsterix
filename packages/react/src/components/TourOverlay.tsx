import type { BackdropInteractionMode } from '@tour/core'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence } from 'motion/react'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import { useAnimationAdapter } from '../motion/animationAdapter'
import type { TourTokenPath } from '../theme/tokens'
import { cssVar } from '../theme/tokens'
import { cn } from '../utils/cn'
import {
  expandRect,
  getViewportRect,
  isBrowser,
  portalHost,
  supportsMasking,
} from '../utils/dom'

export interface TourOverlayProps {
  target: TourTargetInfo
  padding?: number
  radius?: number
  color?: string
  colorClassName?: string
  opacity?: number
  shadow?: string
  shadowToken?: TourTokenPath
  shadowClassName?: string
  zIndex?: number
  edgeBuffer?: number
  blurAmount?: number
  interactionMode?: BackdropInteractionMode
}

const DEFAULT_HIGHLIGHT_TRANSITION = {
  duration: 0.35,
  ease: 'easeOut' as const,
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
  mass: 0.7,
}

const DEFAULT_OVERLAY_TRANSITION = {
  duration: 0.35,
  ease: 'easeOut' as const,
}

export const TourOverlay = ({
  target,
  padding = 12,
  radius = 12,
  color,
  colorClassName,
  opacity = 1,
  shadow,
  shadowToken,
  shadowClassName,
  zIndex = 1000,
  edgeBuffer = 8,
  blurAmount,
  interactionMode = 'passthrough',
}: TourOverlayProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const hasShownRef = useRef(false)
  const lastReadyTargetRef = useRef<TourTargetInfo | null>(null)
  const adapter = useAnimationAdapter()

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

  const maskCapable = useMemo(() => supportsMasking(), [])

  const hasHighlightBounds =
    !!highlightTarget &&
    !resolvedIsScreen &&
    highlightWidth > 0 &&
    highlightHeight > 0

  const shouldMask = maskCapable && hasHighlightBounds

  const maskId = useMemo(
    () => `tour-overlay-mask-${Math.random().toString(36).slice(2, 10)}`,
    [],
  )

  const maskUrl = shouldMask ? `url(#${maskId})` : undefined

  const isActive =
    target.status === 'ready' ||
    (target.status === 'resolving' && cachedTarget !== null)

  const rootPointerClass =
    interactionMode === 'block' ? 'pointer-events-auto' : 'pointer-events-none'

  const overlayPointerClass =
    interactionMode === 'block' ? 'pointer-events-auto' : 'pointer-events-none'

  const segmentPointerClass = overlayPointerClass

  const overlayClassName = cn(
    'absolute origin-center inset-0',
    overlayPointerClass,
    shouldMask ? '[mask-mode:luminance]' : null,
    shouldMask ? '[mask-repeat:no-repeat]' : null,
    shouldMask ? '[mask-size:100%_100%]' : null,
    color ? null : colorClassName,
  )
  const ringClassName = cn(
    'pointer-events-none absolute origin-center',
    shadow || shadowToken ? null : shadowClassName,
  )

  const defaultInsetShadow =
    'inset 0 0 0 2px rgba(56,189,248,0.4), inset 0 0 0 8px rgba(15,23,42,0.3)'

  const defaultRingVar = cssVar('overlay.ringShadow', defaultInsetShadow)
  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : shadowToken
      ? { boxShadow: cssVar(shadowToken) }
      : shadowClassName
        ? undefined
        : { boxShadow: defaultRingVar }

  const { MotionDiv, MotionSvg, MotionDefs, MotionMask, MotionRect } =
    adapter.components

  const highlightTransition =
    adapter.transitions.overlayHighlight ?? DEFAULT_HIGHLIGHT_TRANSITION
  const overlayTransition =
    adapter.transitions.overlayFade ?? DEFAULT_OVERLAY_TRANSITION

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

  const highlightRingAnimation = hasHighlightBounds
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

  const hasExplicitBlur = typeof blurAmount === 'number' && blurAmount >= 0
  const blurValue: string | null = hasExplicitBlur ? `${blurAmount}px` : null
  const blurAnimate: Record<'--tour-overlay-blur', string> | null = blurValue
    ? { '--tour-overlay-blur': blurValue }
    : null
  const blurReset: Record<'--tour-overlay-blur', string> | null = blurValue
    ? { '--tour-overlay-blur': '0px' }
    : null

  const overlayStyle: CSSProperties = {
    zIndex,
    backdropFilter: `blur(${cssVar('overlay.blur', '0px')})`,
    WebkitBackdropFilter: `blur(${cssVar('overlay.blur', '0px')})`,
  }

  if (shouldMask) {
    overlayStyle.maskRepeat = 'no-repeat'
    overlayStyle.WebkitMaskRepeat = 'no-repeat'
    overlayStyle.maskSize = '100% 100%'
    overlayStyle.WebkitMaskSize = '100% 100%'
  }

  if (maskUrl) {
    overlayStyle.mask = maskUrl
    overlayStyle.WebkitMask = maskUrl
  }

  if (color) {
    overlayStyle.backgroundColor = color
  }

  const fallbackSegments = useMemo(() => {
    if (!isActive || shouldMask || !hasHighlightBounds) {
      return null
    }

    const topEdge = Math.max(0, Math.min(highlightTop, viewport.height))
    const bottomEdge = Math.max(
      topEdge,
      Math.min(highlightTop + highlightHeight, viewport.height),
    )
    const leftEdge = Math.max(0, Math.min(highlightLeft, viewport.width))
    const rightEdge = Math.max(
      leftEdge,
      Math.min(highlightLeft + highlightWidth, viewport.width),
    )
    const middleHeight = Math.max(0, bottomEdge - topEdge)

    return [
      {
        key: 'top',
        top: 0,
        left: 0,
        width: viewport.width,
        height: topEdge,
      },
      {
        key: 'bottom',
        top: bottomEdge,
        left: 0,
        width: viewport.width,
        height: Math.max(0, viewport.height - bottomEdge),
      },
      {
        key: 'left',
        top: topEdge,
        left: 0,
        width: leftEdge,
        height: middleHeight,
      },
      {
        key: 'right',
        top: topEdge,
        left: rightEdge,
        width: Math.max(0, viewport.width - rightEdge),
        height: middleHeight,
      },
    ].filter((segment) => segment.width > 0 && segment.height > 0)
  }, [
    hasHighlightBounds,
    highlightHeight,
    highlightLeft,
    highlightTop,
    highlightWidth,
    isActive,
    shouldMask,
    viewport.height,
    viewport.width,
  ])

  const showBaseOverlay = isActive && (shouldMask || !hasHighlightBounds)

  return createPortal(
    <MotionDiv
      className={cn('fixed inset-0', rootPointerClass)}
      style={{ zIndex }}
      aria-hidden={target.status !== 'ready'}
      data-tour-overlay=""
    >
      <AnimatePresence mode="popLayout">
        {shouldMask ? (
          <MotionSvg
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
            <MotionDefs>
              <MotionMask
                id={maskId}
                initial={false}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
                x="0"
                y="0"
                animate={{ width: viewport.width, height: viewport.height }}
                transition={highlightTransition}
              >
                <MotionRect
                  x="0"
                  y="0"
                  initial={false}
                  animate={{
                    width: viewport.width,
                    height: viewport.height,
                    opacity: 1,
                  }}
                  fill="white"
                  transition={highlightTransition}
                  exit={{ opacity: 0 }}
                />
                <MotionRect
                  initial={false}
                  animate={highlightRectAnimation}
                  exit={{
                    x: highlightCenterX,
                    y: highlightCenterY,
                  }}
                  transition={highlightTransition}
                  fill="black"
                />
              </MotionMask>
            </MotionDefs>
          </MotionSvg>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {showBaseOverlay ? (
          <MotionDiv
            key="tour-overlay"
            className={overlayClassName || undefined}
            data-tour-overlay-layer="backdrop"
            style={{
              ...overlayStyle,
              backgroundColor: color ?? undefined,
            }}
            initial={{
              opacity: 0,
              ...(blurReset ?? {}),
              transition: overlayTransition,
            }}
            animate={{
              opacity,
              ...(blurAnimate ?? {}),
            }}
            exit={{
              opacity: 0,
              ...(blurReset ?? {}),
            }}
            transition={overlayTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {fallbackSegments
          ? fallbackSegments.map((segment) => (
              <MotionDiv
                key={`tour-overlay-fallback-${segment.key}`}
                className={cn(
                  'absolute origin-center',
                  segmentPointerClass,
                  color ? null : colorClassName,
                )}
                data-tour-overlay-layer="segment"
                style={{
                  zIndex,
                  top: segment.top,
                  left: segment.left,
                  width: segment.width,
                  height: segment.height,
                  backgroundColor: color ?? undefined,
                  backdropFilter: 'blur(var(--tour-overlay-blur, 0px))',
                  WebkitBackdropFilter: 'blur(var(--tour-overlay-blur, 0px))',
                }}
                initial={{
                  opacity: 0,
                  ...(blurReset ?? {}),
                }}
                animate={{
                  opacity,
                  ...(blurAnimate ?? {}),
                }}
                exit={{ opacity: 0, ...(blurReset ?? {}) }}
                transition={overlayTransition}
              />
            ))
          : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {isActive && hasHighlightBounds ? (
          <MotionDiv
            key="tour-ring"
            className={ringClassName || undefined}
            style={{
              position: 'absolute',
              zIndex: zIndex + 1,
              ...highlightAppearance,
            }}
            data-tour-overlay-layer="highlight-ring"
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
    </MotionDiv>,
    host,
  )
}
