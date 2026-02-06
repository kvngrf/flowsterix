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
}: ConstrainedScrollLockOptions): ConstrainedScrollLockResult => {
  const isConstrainedModeRef = useRef(false)
  const boundsRef = useRef({ minY: 0, maxY: 0 })

  // Derive constrained mode from inputs (no state needed)
  const targetHeight = targetRect ? targetRect.height + padding * 2 : 0
  const effectiveViewportHeight = viewportHeight - bottomInset
  const isConstrainedMode =
    enabled && Boolean(targetRect) && targetHeight > effectiveViewportHeight

  useEffect(() => {
    if (!enabled || !isBrowser) return

    // Calculate if target exceeds the effective viewport (viewport minus bottom inset like mobile drawer)
    const targetHeight = targetRect ? targetRect.height + padding * 2 : 0
    const effectiveViewportHeight = viewportHeight - bottomInset
    const targetExceedsViewport = targetRect && targetHeight > effectiveViewportHeight

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

    // Calculate scroll bounds
    const targetTop = targetRect.top - padding
    const targetBottom = targetRect.bottom + padding
    const currentScroll = window.scrollY

    // minY = target top at viewport top
    // maxY = target bottom just above the drawer
    const minY = currentScroll + targetTop
    const maxY = currentScroll + targetBottom - effectiveViewportHeight

    boundsRef.current = {
      minY: Math.max(0, minY),
      maxY: Math.max(0, maxY),
    }

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
  }, [enabled, targetRect, viewportHeight, padding, bottomInset])

  return { isConstrainedMode }
}
