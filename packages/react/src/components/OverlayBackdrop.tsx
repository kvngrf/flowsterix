import { useRef } from 'react'
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

const DEFAULT_OVERLAY_TRANSITION: Transition = {
  duration: 0.35,
  ease: [0.25, 1, 0.5, 1],
}


export interface OverlayBackdropTransitionsOverride
  extends Partial<
    Pick<AnimationAdapterTransitions, 'overlayHighlight' | 'overlayFade'>
  > {}

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
  /**
   * @deprecated No longer used. The radial glow has been replaced by a box-shadow on the highlight ring.
   */
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
  blurAmount: _blurAmount,
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

  // Track the step ID that owns the current highlight so the SVG key changes
  // between steps. This ensures AnimatePresence properly exits the old cutout
  // and enters the new one instead of morphing the path.
  const highlightStepIdRef = useRef<string | null>(null)
  if (highlight.target && 'stepId' in highlight.target && highlight.target.stepId) {
    highlightStepIdRef.current = highlight.target.stepId
  }
  const highlightKeySuffix = highlightStepIdRef.current ?? 'default'

  const defaultInsetShadow =
    '0 0 0 2px rgba(56,189,248,0.4), 0 0 16px 4px rgba(56,189,248,0.15)'

  const highlightAppearance = shadow
    ? { boxShadow: shadow }
    : { boxShadow: defaultInsetShadow }

  const { MotionDiv, MotionSvg, MotionPath } = adapter.components

  const highlightTransition =
    transitionsOverride?.overlayHighlight ??
    adapter.transitions.overlayHighlight ??
    DEFAULT_HIGHLIGHT_TRANSITION
  const overlayTransition =
    transitionsOverride?.overlayFade ??
    adapter.transitions.overlayFade ??
    DEFAULT_OVERLAY_TRANSITION

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
        {hasCutout && cutoutPath ? (
          <MotionSvg
            key={`tour-overlay-svg-${highlightKeySuffix}`}
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
              transition={highlightTransition}
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
            key={`tour-ring-${highlightKeySuffix}`}
            className={ringClassName}
            style={{
              ...styles.highlightRing,
              zIndex: zIndex + 1,
              ...highlightAppearance,
            }}
            data-tour-overlay-layer="highlight-ring"
            initial={{ ...highlightRingAnimation, opacity: 0 }}
            animate={highlightRingAnimation}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.35,
                ease: [0.25, 1, 0.5, 1],
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
