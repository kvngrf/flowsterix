import { useEffect, useRef, useState } from 'react'

import type { ClientRectLike } from '../utils/dom'
import { getViewportRect, isBrowser } from '../utils/dom'

export const useViewportRect = (): ClientRectLike => {
  const [viewport, setViewport] = useState<ClientRectLike>(() =>
    getViewportRect(),
  )
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isBrowser) return

    const updateViewport = () => {
      rafRef.current = null
      setViewport(getViewportRect())
    }

    const scheduleUpdate = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(updateViewport)
    }

    const listeners: Array<{
      target: EventTarget
      type: string
      handler: EventListenerOrEventListenerObject
    }> = []

    const addListener = (
      target: EventTarget | null | undefined,
      type: string,
      handler: EventListenerOrEventListenerObject,
    ) => {
      if (!target) return
      target.addEventListener(type, handler)
      listeners.push({ target, type, handler })
    }

    addListener(window, 'resize', scheduleUpdate)
    addListener(window, 'orientationchange', scheduleUpdate)
    addListener(window, 'scroll', scheduleUpdate)
    addListener(window.visualViewport ?? null, 'resize', scheduleUpdate)
    addListener(window.visualViewport ?? null, 'scroll', scheduleUpdate)

    return () => {
      listeners.forEach(({ target, type, handler }) =>
        target.removeEventListener(type, handler),
      )
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return viewport
}
