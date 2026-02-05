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
export const useConstrainedScrollLock = ({
  enabled,
  targetRect,
  viewportHeight,
  padding = 0,
}: ConstrainedScrollLockOptions) => {
  const isConstrainedModeRef = useRef(false)
  const boundsRef = useRef({ minY: 0, maxY: 0 })

  useEffect(() => {
    if (!enabled || !isBrowser) return

    // Calculate if target exceeds viewport
    const targetHeight = targetRect ? targetRect.height + padding * 2 : 0
    const targetExceedsViewport = targetRect && targetHeight > viewportHeight

    if (!targetExceedsViewport) {
      // Target fits in viewport - use hard lock
      acquireHardLock()
      isConstrainedModeRef.current = false
      return () => {
        releaseHardLock()
      }
    }

    // Target exceeds viewport - use constrained scroll
    isConstrainedModeRef.current = true

    // Calculate scroll bounds
    // The user should be able to scroll so any part of the target is visible
    const targetTop = targetRect.top - padding
    const targetBottom = targetRect.bottom + padding

    // minY = scroll position where target bottom aligns with viewport bottom
    // maxY = scroll position where target top aligns with viewport top
    const currentScroll = window.scrollY
    const minY = currentScroll + targetTop
    const maxY = currentScroll + targetBottom - viewportHeight

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
  }, [enabled, targetRect, viewportHeight, padding])
}
