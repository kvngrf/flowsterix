import { useEffect, useRef } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { isBrowser } from '../utils/dom'

export interface ConstrainedScrollLockOptions {
  /**
   * Whether scroll lock is enabled.
   */
  enabled: boolean
  /**
   * The target element's bounding rect.
   * If target is larger than viewport, scrolling is allowed within target bounds.
   */
  targetRect: ClientRectLike | null
  /**
   * Viewport height. Used to determine if target exceeds viewport.
   */
  viewportHeight: number
  /**
   * Additional padding around the target bounds (for highlight padding).
   * Default: 0
   */
  padding?: number
  /**
   * Bottom inset in pixels (e.g. mobile drawer height) to account for
   * when calculating scroll bounds. Increases maxY so users can scroll
   * the target bottom into view above the inset area.
   * Default: 0
   */
  bottomInset?: number
  /**
   * Additional top inset in pixels to keep free space above the target
   * while constrained scrolling (for step `scrollMargin.top`).
   * Default: 0
   */
  topInset?: number
  /**
   * Additional bottom margin in pixels to keep free space below the target
   * while constrained scrolling (for step `scrollMargin.bottom`).
   * Default: 0
   */
  bottomMargin?: number
}

const sanitizeInset = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, value)
}

const resolveEffectiveViewportHeight = (
  viewportHeight: number,
  bottomInset: number,
  topInset: number,
  bottomMargin: number,
) => Math.max(1, viewportHeight - bottomInset - topInset - bottomMargin)

export const computeConstrainedScrollBounds = ({
  targetRect,
  currentScrollY,
  viewportHeight,
  padding = 0,
  bottomInset = 0,
  topInset = 0,
  bottomMargin = 0,
}: {
  targetRect: ClientRectLike
  currentScrollY: number
  viewportHeight: number
  padding?: number
  bottomInset?: number
  topInset?: number
  bottomMargin?: number
}) => {
  const safePadding = Math.max(0, padding)
  const safeBottomInset = sanitizeInset(bottomInset)
  const safeTopInset = sanitizeInset(topInset)
  const safeBottomMargin = sanitizeInset(bottomMargin)

  const targetTop = targetRect.top - safePadding
  const targetBottom = targetRect.bottom + safePadding

  const minY = currentScrollY + targetTop - safeTopInset
  const bottomLimit = viewportHeight - safeBottomInset - safeBottomMargin
  const maxY = currentScrollY + targetBottom - bottomLimit

  const clampedMinY = Math.max(0, minY)
  const clampedMaxY = Math.max(clampedMinY, maxY)

  return {
    minY: clampedMinY,
    maxY: clampedMaxY,
  }
}

let lockCount = 0
let previousOverflow: string | null = null

const acquireHardLock = () => {
  if (!isBrowser) return
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

const releaseHardLock = () => {
  if (!isBrowser) return
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? ''
    previousOverflow = null
  }
}

/**
 * Enhanced scroll lock that allows constrained scrolling when target is larger than viewport.
 *
 * - If target fits in viewport: normal scroll lock (overflow: hidden)
 * - If target > viewport: allow scrolling within target bounds only
 */
export interface ConstrainedScrollLockResult {
  /** Whether constrained scroll mode is active (target exceeds effective viewport). */
  isConstrainedMode: boolean
}

export const useConstrainedScrollLock = ({
  enabled,
  targetRect,
  viewportHeight,
  padding = 0,
  bottomInset = 0,
  topInset = 0,
  bottomMargin = 0,
}: ConstrainedScrollLockOptions): ConstrainedScrollLockResult => {
  const isConstrainedModeRef = useRef(false)
  const boundsRef = useRef({ minY: 0, maxY: 0 })

  const safeBottomInset = sanitizeInset(bottomInset)
  const safeTopInset = sanitizeInset(topInset)
  const safeBottomMargin = sanitizeInset(bottomMargin)

  // Derive constrained mode from inputs (no state needed)
  const targetHeight = targetRect ? targetRect.height + padding * 2 : 0
  const effectiveViewportHeight = resolveEffectiveViewportHeight(
    viewportHeight,
    safeBottomInset,
    safeTopInset,
    safeBottomMargin,
  )
  const isConstrainedMode =
    enabled && Boolean(targetRect) && targetHeight > effectiveViewportHeight

  useEffect(() => {
    if (!enabled || !isBrowser) return
    if (!isConstrainedMode) return
    if (!targetRect) return

    boundsRef.current = computeConstrainedScrollBounds({
      targetRect,
      currentScrollY: window.scrollY,
      viewportHeight,
      padding,
      bottomInset: safeBottomInset,
      topInset: safeTopInset,
      bottomMargin: safeBottomMargin,
    })

    const { minY, maxY } = boundsRef.current
    const currentY = window.scrollY
    if (currentY < minY) {
      window.scrollTo({ top: minY, behavior: 'auto' })
    } else if (currentY > maxY) {
      window.scrollTo({ top: maxY, behavior: 'auto' })
    }
  }, [
    enabled,
    isConstrainedMode,
    targetRect,
    viewportHeight,
    padding,
    safeBottomInset,
    safeTopInset,
    safeBottomMargin,
  ])

  useEffect(() => {
    if (!enabled || !isBrowser) return

    const targetExceedsViewport =
      Boolean(targetRect) && targetHeight > effectiveViewportHeight

    if (!targetExceedsViewport) {
      // Target fits in effective viewport - use hard lock
      acquireHardLock()
      isConstrainedModeRef.current = false
      return () => {
        releaseHardLock()
      }
    }

    // Target exceeds effective viewport - use constrained scroll
    isConstrainedModeRef.current = true

    // Scroll handler that constrains scroll position
    const handleScroll = () => {
      const { minY, maxY } = boundsRef.current
      const currentY = window.scrollY

      if (currentY < minY) {
        window.scrollTo({ top: minY, behavior: 'auto' })
      } else if (currentY > maxY) {
        window.scrollTo({ top: maxY, behavior: 'auto' })
      }
    }

    // Initial clamp
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: false })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      isConstrainedModeRef.current = false
    }
  }, [
    enabled,
    Boolean(targetRect),
    targetRect?.height,
    viewportHeight,
    padding,
    safeBottomInset,
    safeTopInset,
    safeBottomMargin,
    targetHeight,
    effectiveViewportHeight,
  ])

  return { isConstrainedMode }
}
