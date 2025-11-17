import { useEffect } from 'react'

import { isBrowser } from '../utils/dom'

let lockCount = 0
let previousOverflow: string | null = null

const acquireLock = () => {
  if (!isBrowser) return
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

const releaseLock = () => {
  if (!isBrowser) return
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? ''
    previousOverflow = null
  }
}

export const useBodyScrollLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return
    acquireLock()
    return () => {
      releaseLock()
    }
  }, [enabled])
}
