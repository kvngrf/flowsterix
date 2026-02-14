import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Transition } from 'motion/react'
import { AnimatePresence } from 'motion/react'

import type { UseTourOverlayResult } from '../hooks/useTourOverlay'
import type { AnimationAdapterTransitions } from '../motion/animationAdapter'
import { useAnimationAdapter } from '../motion/animationAdapter'
import { isBrowser, portalHost } from '../utils/dom'
import { buildOverlayCutoutPath } from './overlayPath'

const styles = {
  root: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  overlay: {
    position: 'absolute' as const,
    transformOrigin: 'center',
    inset: 0,
    pointerEvents: 'none' as const,
  },
  svgBackdrop: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  uniformGlow: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  blockerContainer: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  blockerSegment: {
    position: 'absolute' as const,
    pointerEvents: 'auto' as const,
  },
  highlightRing: {
    position: 'absolute' as const,
    transformOrigin: 'center',
    pointerEvents: 'none' as const,
  },
} as const

const DEFAULT_HIGHLIGHT_TRANSITION: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
  mass: 0.7,
}

const DEFAULT_HIGHLIGHT_COLLAPSE_TRANSITION: Transition = {
  duration: 0.18,
  ease: [0.25, 1, 0.5, 1],
  type: 'tween',
}

const DEFAULT_OVERLAY_TRANSITION: Transition = {
  duration: 0.35,
  ease: [0.25, 1, 0.5, 1],
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const getFauxGlowBackground = ({
  centerX,
  centerY,
  radiusPx,
  blurPx,
  overlayOpacity,
}: {
  centerX: number
  centerY: number
  radiusPx: number
  blurPx: number
  overlayOpacity: number
}) => {
  const safeRadius = Math.max(1, radiusPx)
  const blurFactor = clamp(blurPx / 10, 0.55, 1.8)
  const opacityFactor = clamp(overlayOpacity, 0.2, 1)

  const midAlpha = clamp(0.12 * blurFactor * opacityFactor, 0.04, 0.22)
  const ambientAlpha = clamp(0.09 * blurFactor * opacityFactor, 0.03, 0.18)

  const innerDeadZone = safeRadius * 0.42
  const midStop = safeRadius * 0.86
  const outerStop = safeRadius * 1.22
  const ambientStop = safeRadius * (1.75 + blurFactor * 0.32)

  return [
    `radial-gradient(circle at ${centerX}px ${centerY}px, rgba(255,255,255,0) 0px, rgba(255,255,255,0) ${Math.max(
      0,
      innerDeadZone,
    )}px, rgba(255,255,255,${midAlpha.toFixed(3)}) ${Math.max(
      0,
      midStop,
    )}px, rgba(255,255,255,0) ${Math.max(0, outerStop)}px)`,
    `radial-gradient(circle at ${centerX}px ${centerY}px, rgba(255,255,255,0) ${Math.max(
      0,
      midStop * 0.72,
    )}px, rgba(255,255,255,${ambientAlpha.toFixed(3)}) ${Math.max(
      0,
      outerStop,
    )}px, rgba(255,255,255,0) ${Math.max(0, ambientStop)}px)`,
  ].join(',')
}

export interface OverlayBackdropTransitionsOverride
  extends Partial<
    Pick<AnimationAdapterTransitions, 'overlayHighlight' | 'overlayFade'>
  > {
  overlayHighlightCollapse?: Transition
}

export interface OverlayBackdropProps {
  overlay: UseTourOverlayResult
  zIndex?: number
  color?: string
  /**
   * @deprecated Use `color` prop instead. This is kept for backwards compatibility but has no effect.
   */
  colorClassName?: string
  opacity?: number
  shadow?: string
  blurAmount?: number
  ariaHidden?: boolean
  rootClassName?: string
  overlayClassName?: string
  ringClassName?: string
  showHighlightRing?: boolean
  showInteractionBlocker?: boolean
  transitionsOverride?: OverlayBackdropTransitionsOverride
}

export const OverlayBackdrop = ({
  overlay,
  zIndex = 1000,
  color,
  colorClassName: _colorClassName,
  opacity = 1,
  shadow,
  blurAmount,
  ariaHidden,
  rootClassName,
  overlayClassName,
  ringClassName,
  showHighlightRing = true,
  showInteractionBlocker = true,
  transitionsOverride,
}: OverlayBackdropProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const adapter = useAnimationAdapter()
  const { highlight, blockerSegments, showBaseOverlay, isActive, viewport } = overlay
  const hasHighlightBounds = Boolean(highlight.rect)

  const prevScreenTargetRef = useRef<boolean | null>(null)
  const shouldSnapHighlight =
    prevScreenTargetRef.current === true &&
    !highlight.isScreen &&
    hasHighlightBounds

  useEffect(() => {
    prevScreenTargetRef.current = highlight.isScreen
  }, [highlight.isScreen])

  const defaultInsetShadow =
    'inset 0 0 0 2px rgba(56,189,248,0.4), inset 0 0 0 8px rgba(15,23,42,0.3)'

  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : { boxShadow: defaultInsetShadow }

  const { MotionDiv, MotionSvg, MotionPath } = adapter.components

  const highlightTransition =
    transitionsOverride?.overlayHighlight ??
    adapter.transitions.overlayHighlight ??
    DEFAULT_HIGHLIGHT_TRANSITION
  const snapTransition: Transition = { type: 'tween', duration: 0 }
  const resolvedHighlightTransition = shouldSnapHighlight
    ? snapTransition
    : highlightTransition
  const overlayTransition =
    transitionsOverride?.overlayFade ??
    adapter.transitions.overlayFade ??
    DEFAULT_OVERLAY_TRANSITION

  const highlightCollapseTransition = highlight.isScreen
    ? snapTransition
    : (transitionsOverride?.overlayHighlightCollapse ??
      DEFAULT_HIGHLIGHT_COLLAPSE_TRANSITION)

  const highlightRectTransition = hasHighlightBounds
    ? resolvedHighlightTransition
    : highlightCollapseTransition

  const highlightRingAnimation = hasHighlightBounds
    ? {
        top: highlight.centerY,
        left: highlight.centerX,
        width: highlight.rect?.width ?? 0,
        height: highlight.rect?.height ?? 0,
        borderRadius: highlight.rect?.radius ?? 0,
        opacity: 1,
        transform: 'translate(-50%, -50%)',
      }
    : {
        top: highlight.centerY,
        left: highlight.centerX,
        width: 0,
        height: 0,
        borderRadius: 0,
        opacity: 0,
        transform: 'translate(-50%, -50%)',
      }

  const hasCutout = isActive && hasHighlightBounds && !!highlight.rect
  const cutoutPath = hasCutout && highlight.rect
    ? buildOverlayCutoutPath({
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        rect: highlight.rect,
      })
    : null

  const resolvedBlurPx =
    typeof blurAmount === 'number' ? Math.max(0, blurAmount) : 6
  const uniformGlowRadius = highlight.rect
    ? Math.max(highlight.rect.width, highlight.rect.height) * 1.35
    : 0
  const uniformGlowBackground =
    hasCutout
      ? getFauxGlowBackground({
          centerX: highlight.centerX,
          centerY: highlight.centerY,
          radiusPx: uniformGlowRadius,
          blurPx: resolvedBlurPx,
          overlayOpacity: opacity,
        })
      : null

  return createPortal(
    <MotionDiv
      className={rootClassName}
      style={{ ...styles.root, zIndex }}
      aria-hidden={ariaHidden}
      data-tour-overlay=""
    >
      <AnimatePresence mode="popLayout">
        {showBaseOverlay ? (
          <MotionDiv
            key="tour-overlay"
            className={overlayClassName}
            data-tour-overlay-layer="backdrop"
            style={{
              ...styles.overlay,
              zIndex,
              backgroundColor: color ?? undefined,
            }}
            initial={{
              opacity: 0,
              transition: overlayTransition,
            }}
            animate={{ opacity }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {uniformGlowBackground ? (
          <MotionDiv
            key="tour-overlay-uniform-glow"
            style={{
              ...styles.uniformGlow,
              zIndex,
              backgroundImage: uniformGlowBackground,
            }}
            data-tour-overlay-layer="uniform-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {hasCutout && cutoutPath ? (
          <MotionSvg
            key="tour-overlay-svg"
            width={viewport.width}
            height={viewport.height}
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            preserveAspectRatio="none"
            aria-hidden
            focusable="false"
            style={{ ...styles.svgBackdrop, zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            data-tour-overlay-layer="svg"
          >
            <MotionPath
              initial={false}
              animate={{ d: cutoutPath }}
              transition={highlightRectTransition}
              fill={color ?? 'rgba(0, 0, 0, 0.5)'}
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </MotionSvg>
        ) : null}
      </AnimatePresence>
      {showInteractionBlocker && blockerSegments ? (
        <div
          style={{ ...styles.blockerContainer, zIndex }}
          data-tour-overlay-layer="interaction-blocker"
          aria-hidden
        >
          {blockerSegments.map((segment) => (
            <div
              key={segment.key}
              style={{
                ...styles.blockerSegment,
                top: segment.top,
                left: segment.left,
                width: segment.width,
                height: segment.height,
              }}
            />
          ))}
        </div>
      ) : null}
      <AnimatePresence mode="popLayout">
        {showHighlightRing && isActive && hasHighlightBounds ? (
          <MotionDiv
            key="tour-ring"
            className={ringClassName}
            style={{
              ...styles.highlightRing,
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
                ease: [0.25, 1, 0.5, 1],
              },
            }}
            transition={resolvedHighlightTransition}
          />
        ) : null}
      </AnimatePresence>
    </MotionDiv>,
    host,
  )
}
