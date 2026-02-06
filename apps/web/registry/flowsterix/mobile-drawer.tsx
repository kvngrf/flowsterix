'use client'

import { useTour } from '@flowsterix/react'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type PanInfo,
} from 'motion/react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { MobileDrawerHandle } from '@/registry/flowsterix/mobile-drawer-handle'
import { TourControls } from '@/registry/flowsterix/tour-controls'
import { TourProgress } from '@/registry/flowsterix/tour-progress'

// =============================================================================
// Types
// =============================================================================

export type MobileDrawerSnapPoint = 'minimized' | 'peek' | 'expanded'

export interface MobileDrawerProps {
  /** Content to render inside the drawer */
  children: React.ReactNode
  /** Snap point when drawer opens (default: 'expanded') */
  defaultSnapPoint?: MobileDrawerSnapPoint
  /** Available snap points (default: ['minimized', 'expanded']) */
  snapPoints?: MobileDrawerSnapPoint[]
  /** Whether user can minimize the drawer (default: true) */
  allowMinimize?: boolean
  /** Maximum height as ratio of viewport (default: 0.85) */
  maxHeightRatio?: number
  /** Callback when snap point changes */
  onSnapPointChange?: (point: MobileDrawerSnapPoint) => void
  /** Additional class names */
  className?: string
  /** Controls configuration */
  controls?: React.ComponentProps<typeof TourControls>
  /** Progress configuration */
  progress?: React.ComponentProps<typeof TourProgress> & { show?: boolean }
  /** Step key for crossfade animation */
  stepKey?: string
  /** Callback reporting the visible drawer height for scroll lock inset */
  onDrawerHeightChange?: (height: number) => void
}

// =============================================================================
// Constants
// =============================================================================

const MINIMIZED_HEIGHT = 100
const HANDLE_HEIGHT = 28 // py-3 = 24px + 4px pill
const HEADER_HEIGHT = 40 // progress row
const CONTROLS_HEIGHT = 72 // controls padding + buttons
const CHROME_HEIGHT = HANDLE_HEIGHT + HEADER_HEIGHT + CONTROLS_HEIGHT
const PEEK_RATIO = 0.4
const DEFAULT_MAX_HEIGHT_RATIO = 0.85
const VELOCITY_THRESHOLD = 500
const DRAG_ELASTIC = { top: 0.1, bottom: 0.3 }

const springConfig = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 400,
}

// =============================================================================
// Hooks
// =============================================================================

function useSnapPoints({
  snapPoints,
  viewportHeight,
  safeAreaBottom,
  contentHeight,
  maxHeightRatio,
}: {
  snapPoints: MobileDrawerSnapPoint[]
  viewportHeight: number
  safeAreaBottom: number
  contentHeight: number
  maxHeightRatio: number
}) {
  return React.useMemo(() => {
    const viewportMax = (viewportHeight - safeAreaBottom) * maxHeightRatio
    const isMeasured = contentHeight >= 0

    // Before measurement: use small initial height to avoid flicker
    // After measurement: use content height + chrome, capped at viewport max
    const initialHeight = MINIMIZED_HEIGHT + 120 // Small initial size
    const idealExpandedHeight = isMeasured
      ? contentHeight + CHROME_HEIGHT
      : initialHeight
    const expandedHeight = Math.min(
      Math.max(idealExpandedHeight, MINIMIZED_HEIGHT + 100),
      viewportMax,
    )

    const heights: Record<MobileDrawerSnapPoint, number> = {
      minimized: MINIMIZED_HEIGHT,
      peek: Math.round(Math.max(expandedHeight * PEEK_RATIO, MINIMIZED_HEIGHT + 50)),
      expanded: Math.round(expandedHeight),
    }

    // Filter to only enabled snap points and sort by height
    const enabled = snapPoints
      .map((point) => ({ point, height: heights[point] }))
      .sort((a, b) => a.height - b.height)

    return { heights, enabled, maxHeight: viewportMax, isMeasured }
  }, [snapPoints, viewportHeight, safeAreaBottom, contentHeight, maxHeightRatio])
}

function useSafeAreaBottom() {
  const [safeAreaBottom, setSafeAreaBottom] = React.useState(0)

  React.useEffect(() => {
    const computeSafeArea = () => {
      const computed = getComputedStyle(document.documentElement)
      const value = computed.getPropertyValue('--sab') || '0'
      setSafeAreaBottom(parseInt(value, 10) || 0)
    }

    // Set CSS variable for safe area
    document.documentElement.style.setProperty(
      '--sab',
      'env(safe-area-inset-bottom, 0px)',
    )

    // Initial compute after a frame to ensure CSS is applied
    requestAnimationFrame(computeSafeArea)

    window.addEventListener('resize', computeSafeArea)
    return () => window.removeEventListener('resize', computeSafeArea)
  }, [])

  return safeAreaBottom
}

function useViewportHeight() {
  const [height, setHeight] = React.useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  )

  React.useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport for iOS Safari keyboard handling
      const vh = window.visualViewport?.height ?? window.innerHeight
      setHeight(vh)
    }

    updateHeight()

    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height
}

function useContentHeight() {
  // Start with -1 to indicate "not yet measured"
  const [contentHeight, setContentHeight] = React.useState(-1)
  const observerRef = React.useRef<ResizeObserver | null>(null)

  // Callback ref: re-attaches ResizeObserver whenever AnimatePresence swaps elements
  const contentRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) return

    const measure = () => {
      setContentHeight(node.scrollHeight)
    }

    requestAnimationFrame(measure)

    observerRef.current = new ResizeObserver(measure)
    observerRef.current.observe(node)
  }, [])

  React.useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  return { contentRef, contentHeight }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Mobile-optimized bottom sheet drawer for tour content.
 * Features swipe gestures, snap points, and safe area support.
 *
 * @example
 * ```tsx
 * <MobileDrawer
 *   defaultSnapPoint="expanded"
 *   snapPoints={['minimized', 'expanded']}
 *   onSnapPointChange={(point) => console.log(point)}
 * >
 *   <StepContent />
 * </MobileDrawer>
 * ```
 */
export function MobileDrawer({
  children,
  defaultSnapPoint = 'expanded',
  snapPoints: snapPointsProp = ['minimized', 'expanded'],
  allowMinimize = true,
  maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
  onSnapPointChange,
  className,
  controls,
  progress = { show: false, variant: 'fraction' },
  stepKey,
  onDrawerHeightChange,
}: MobileDrawerProps) {
  const { state } = useTour()
  const viewportHeight = useViewportHeight()
  const safeAreaBottom = useSafeAreaBottom()
  const { contentRef, contentHeight } = useContentHeight()

  // Ensure minimized is available if allowMinimize
  const snapPoints = React.useMemo(() => {
    if (allowMinimize && !snapPointsProp.includes('minimized')) {
      return ['minimized', ...snapPointsProp] as MobileDrawerSnapPoint[]
    }
    if (!allowMinimize) {
      return snapPointsProp.filter((p) => p !== 'minimized')
    }
    return snapPointsProp
  }, [snapPointsProp, allowMinimize])

  const { heights, enabled, isMeasured } = useSnapPoints({
    snapPoints,
    viewportHeight,
    safeAreaBottom,
    contentHeight,
    maxHeightRatio,
  })

  const [currentSnapPoint, setCurrentSnapPoint] =
    React.useState<MobileDrawerSnapPoint>(defaultSnapPoint)
  const [isDragging, setIsDragging] = React.useState(false)

  const controls_ = useAnimationControls()

  // Drawer has fixed height (expandedHeight)
  // translateY pushes it down: 0 = expanded, (expanded - minimized) = minimized
  const expandedHeight = heights['expanded']

  // Calculate translateY for each snap point
  const getTranslateY = React.useCallback(
    (point: MobileDrawerSnapPoint) => {
      const targetHeight = heights[point]
      return expandedHeight - targetHeight
    },
    [heights, expandedHeight],
  )

  // Max drag = push down to minimized
  const maxTranslateY = expandedHeight - MINIMIZED_HEIGHT

  // Is minimized state
  const isMinimized = currentSnapPoint === 'minimized'

  // Animate to correct position when content is measured
  const wasMeasuredRef = React.useRef(false)
  React.useEffect(() => {
    if (isMeasured && !wasMeasuredRef.current) {
      wasMeasuredRef.current = true
      // Smoothly animate to the correct height now that we know content size
      const targetY = getTranslateY(currentSnapPoint)
      controls_.start({ y: targetY }, springConfig)
    }
  }, [isMeasured, currentSnapPoint, getTranslateY, controls_])

  // Animate drawer height changes between steps
  React.useEffect(() => {
    controls_.start({ height: expandedHeight }, springConfig)
  }, [expandedHeight, controls_])

  // Report visible drawer height for scroll lock inset
  React.useEffect(() => {
    onDrawerHeightChange?.(heights[currentSnapPoint])
  }, [heights, currentSnapPoint, onDrawerHeightChange])

  // Content opacity: fade based on current translateY
  const contentOpacity =
    currentSnapPoint === 'minimized'
      ? 0
      : currentSnapPoint === 'peek'
        ? 0.7
        : 1

  // Reset to expanded on step change
  const stepIndex = state?.stepIndex
  React.useEffect(() => {
    if (stepIndex !== undefined) {
      setCurrentSnapPoint('expanded')
      controls_.start({ y: 0 }, springConfig)
    }
  }, [stepIndex, controls_])

  // Snap to point
  const snapTo = React.useCallback(
    (point: MobileDrawerSnapPoint) => {
      const targetY = getTranslateY(point)
      setCurrentSnapPoint(point)
      controls_.start({ y: targetY }, springConfig)
      onSnapPointChange?.(point)
    },
    [getTranslateY, controls_, onSnapPointChange],
  )

  // Calculate nearest snap point based on drag position and velocity
  const calculateSnapPoint = React.useCallback(
    (currentY: number, velocity: number): MobileDrawerSnapPoint => {
      // Project where we'll end up based on velocity
      const projectedY = currentY + velocity * 0.15

      // If fast swipe, go to direction
      if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
        if (velocity > 0) {
          // Swiping down -> go to next smaller height (larger Y)
          const currentHeight = expandedHeight - currentY
          const smaller = enabled.filter((s) => s.height < currentHeight)
          return smaller.length > 0
            ? smaller[smaller.length - 1].point
            : currentSnapPoint
        } else {
          // Swiping up -> go to next larger height (smaller Y)
          const currentHeight = expandedHeight - currentY
          const larger = enabled.filter((s) => s.height > currentHeight)
          return larger.length > 0 ? larger[0].point : currentSnapPoint
        }
      }

      // Otherwise, find nearest snap point by Y position
      let nearest = enabled[0]
      let minDistance = Math.abs(projectedY - getTranslateY(nearest.point))

      for (const snap of enabled) {
        const snapY = getTranslateY(snap.point)
        const distance = Math.abs(projectedY - snapY)
        if (distance < minDistance) {
          minDistance = distance
          nearest = snap
        }
      }

      return nearest.point
    },
    [enabled, expandedHeight, currentSnapPoint, getTranslateY],
  )

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false)
    // Get current visual Y position from the animation
    const element = document.querySelector('[data-mobile-drawer]') as HTMLElement
    const transform = element?.style.transform || ''
    const match = transform.match(/translateY\(([^)]+)px\)/)
    const currentY = match ? parseFloat(match[1]) : getTranslateY(currentSnapPoint)

    const targetPoint = calculateSnapPoint(currentY, info.velocity.y)
    snapTo(targetPoint)
  }

  // Handle tap to toggle between minimized and expanded
  const handleHandleTap = () => {
    if (isMinimized) {
      snapTo('expanded')
    } else if (currentSnapPoint === 'expanded' && snapPoints.includes('peek')) {
      snapTo('peek')
    } else if (currentSnapPoint === 'peek') {
      snapTo('expanded')
    }
  }

  return (
    <motion.div
      className={cn(
        'fixed inset-x-0 bottom-0 z-[2002]',
        className,
      )}
      style={{
        paddingBottom: `env(safe-area-inset-bottom, 0px)`,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: maxTranslateY }}
      dragElastic={DRAG_ELASTIC}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls_}
      initial={{ y: getTranslateY(defaultSnapPoint), height: expandedHeight }}
      data-mobile-drawer=""
      data-snap-point={currentSnapPoint}
    >
      <motion.div
        className={cn(
          'flex h-full flex-col overflow-hidden',
          'rounded-t-[20px] border-t border-x border-border',
          'bg-popover text-popover-foreground',
          'shadow-[0_-8px_32px_rgba(0,0,0,0.15)]',
          'touch-none',
        )}
      >
        {/* Drag handle */}
        <div onClick={handleHandleTap} className="cursor-pointer">
          <MobileDrawerHandle isDragging={isDragging} />
        </div>

        {/* Aria live region for minimized state */}
        {isMinimized && (
          <span className="sr-only" role="status" aria-live="polite">
            Tour content minimized. Swipe up or tap to expand.
          </span>
        )}

        {/* Content area - fades when minimized */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 transition-opacity duration-200"
          style={{ opacity: contentOpacity }}
          aria-hidden={isMinimized}
        >
          <AnimatePresence mode="wait">
            <motion.div
              ref={contentRef}
              key={stepKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress - centered below content */}
        {progress.show && !isMinimized && (
          <div className="flex justify-center px-4 pb-2">
            <TourProgress
              variant={progress.variant ?? 'fraction'}
              size={progress.size ?? 'sm'}
              className={progress.className}
            />
          </div>
        )}

        {/* Controls - always visible */}
        <div className="shrink-0">
          <TourControls {...controls} />
        </div>
      </motion.div>
    </motion.div>
  )
}
