import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Transition } from 'motion/react'
import { AnimatePresence } from 'motion/react'

import type { UseTourOverlayResult } from '../hooks/useTourOverlay'
import type { AnimationAdapterTransitions } from '../motion/animationAdapter'
import { useAnimationAdapter } from '../motion/animationAdapter'
import type { TourTokenPath } from '../theme/tokens'
import { cssVar } from '../theme/tokens'
import { isBrowser, portalHost } from '../utils/dom'

// =============================================================================
// Inline style helpers (replacing Tailwind classes for headless compatibility)
// =============================================================================

const styles = {
  root: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
  },
  svgMask: {
    position: 'absolute' as const,
  },
  overlay: {
    position: 'absolute' as const,
    transformOrigin: 'center',
    inset: 0,
    pointerEvents: 'none' as const,
  },
  segment: {
    position: 'absolute' as const,
    transformOrigin: 'center',
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
  duration: 0.35,
  ease: 'easeOut',
  type: 'spring',
  damping: 25,
  stiffness: 300,
  mass: 0.7,
}

const DEFAULT_HIGHLIGHT_COLLAPSE_TRANSITION: Transition = {
  duration: 0.18,
  ease: 'easeOut',
  type: 'tween',
}

const DEFAULT_OVERLAY_TRANSITION: Transition = {
  duration: 0.35,
  ease: 'easeOut',
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
  /** Background color of the overlay */
  color?: string
  /**
   * @deprecated Use `color` prop instead. This is kept for backwards compatibility but has no effect.
   */
  colorClassName?: string
  opacity?: number
  /** Box shadow for the highlight ring */
  shadow?: string
  /** CSS variable token path for the shadow */
  shadowToken?: TourTokenPath
  /**
   * @deprecated Use `shadow` or `shadowToken` props instead. This is kept for backwards compatibility but has no effect.
   */
  shadowClassName?: string
  blurAmount?: number
  ariaHidden?: boolean
  /** Additional class name for the root element */
  rootClassName?: string
  /** Additional class name for the overlay backdrop */
  overlayClassName?: string
  /** Additional class name for fallback segments */
  segmentClassName?: string
  /** Additional class name for the highlight ring */
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
  shadowToken,
  shadowClassName: _shadowClassName,
  blurAmount,
  ariaHidden,
  rootClassName,
  overlayClassName,
  segmentClassName,
  ringClassName,
  showHighlightRing = true,
  showInteractionBlocker = true,
  transitionsOverride,
}: OverlayBackdropProps) => {
  if (!isBrowser) return null
  const host = portalHost()
  if (!host) return null

  const adapter = useAnimationAdapter()
  const {
    highlight,
    shouldMask,
    maskId,
    maskUrl,
    fallbackSegments,
    blockerSegments,
    showBaseOverlay,
    isActive,
    viewport,
  } = overlay
  const hasHighlightBounds = Boolean(highlight.rect)

  const prevScreenTargetRef = useRef<boolean | null>(null)
  const shouldSnapHighlight =
    prevScreenTargetRef.current === true &&
    !highlight.isScreen &&
    hasHighlightBounds

  useEffect(() => {
    prevScreenTargetRef.current = highlight.isScreen
  }, [highlight.isScreen])

  // Compute blur value: use prop if provided, otherwise fall back to CSS var
  const resolvedBlur =
    typeof blurAmount === 'number'
      ? `${blurAmount}px`
      : cssVar('overlay.blur', '0px')

  const defaultInsetShadow =
    'inset 0 0 0 2px rgba(56,189,248,0.4), inset 0 0 0 8px rgba(15,23,42,0.3)'

  const defaultRingVar = cssVar('overlay.ringShadow', defaultInsetShadow)
  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : shadowToken
      ? { boxShadow: cssVar(shadowToken) }
      : { boxShadow: defaultRingVar }

  const { MotionDiv, MotionSvg, MotionDefs, MotionMask, MotionRect } =
    adapter.components

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

  const highlightRectAnimation = shouldMask
    ? {
        x: highlight.rect?.left ?? highlight.centerX,
        y: highlight.rect?.top ?? highlight.centerY,
        width: highlight.rect?.width ?? 0,
        height: highlight.rect?.height ?? 0,
        rx: highlight.rect?.radius ?? 0,
        ry: highlight.rect?.radius ?? 0,
      }
    : {
        x: highlight.centerX,
        y: highlight.centerY,
        width: 0,
        height: 0,
        rx: 0,
        ry: 0,
      }

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

  const overlayStyle: CSSProperties = {}

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

  return createPortal(
    <MotionDiv
      className={rootClassName}
      style={{ ...styles.root, zIndex }}
      aria-hidden={ariaHidden}
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
            style={styles.svgMask}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          >
            <MotionDefs>
              <MotionMask
                id={maskId ?? undefined}
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
                    x: highlight.centerX,
                    y: highlight.centerY,
                  }}
                  transition={highlightRectTransition}
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
            className={overlayClassName}
            data-tour-overlay-layer="backdrop"
            style={{
              ...styles.overlay,
              ...overlayStyle,
              zIndex,
              backgroundColor: color ?? undefined,
            }}
            initial={{
              opacity: 0,
              transition: overlayTransition,
              backdropFilter: `blur(0px)`,
            }}
            animate={{
              opacity,
              backdropFilter: `blur(${resolvedBlur})`,
            }}
            exit={{
              opacity: 0,
              backdropFilter: `blur(${resolvedBlur})`,
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
                className={segmentClassName}
                data-tour-overlay-layer="segment"
                style={{
                  ...styles.segment,
                  zIndex,
                  top: segment.top,
                  left: segment.left,
                  width: segment.width,
                  height: segment.height,
                  backgroundColor: color ?? undefined,
                }}
                initial={{
                  opacity: 0,
                  backdropFilter: `blur(0px)`,
                }}
                animate={{
                  opacity,
                  backdropFilter: `blur(${resolvedBlur})`,
                }}
                exit={{
                  opacity: 0,
                  backdropFilter: `blur(0px)`,
                }}
                transition={overlayTransition}
              />
            ))
          : null}
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
                ease: 'easeOut',
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
