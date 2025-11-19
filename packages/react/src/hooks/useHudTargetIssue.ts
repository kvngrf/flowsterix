import { useEffect, useMemo, useState } from 'react'

import { isBrowser } from '../utils/dom'
import type { TourTargetInfo } from './useTourTarget'

export type HudTargetIssueType = 'missing' | 'hidden' | 'detached'

export interface HudTargetIssue {
  type: HudTargetIssueType
  title: string
  body: string
  hint?: string
}

export interface UseHudTargetIssueOptions {
  /**
   * Delay before reporting an issue, to avoid flicker while a target is mounting.
   * Defaults to 500ms.
   */
  delayMs?: number
}

export interface UseHudTargetIssueResult {
  issue: HudTargetIssue | null
  rawIssue: HudTargetIssue | null
}

const deriveTargetIssue = (target: TourTargetInfo): HudTargetIssue | null => {
  if (target.isScreen) return null
  if (target.status === 'idle') return null
  switch (target.visibility) {
    case 'missing':
      return {
        type: 'missing',
        title: 'Looking for the target',
        body: 'Flowster is still trying to find this element. Make sure the UI piece is mounted or adjust the selector.',
        hint:
          target.rectSource === 'stored'
            ? 'Showing the last known position until the element returns.'
            : undefined,
      }
    case 'hidden':
      return {
        type: 'hidden',
        title: 'Target is hidden',
        body: 'The element exists but is currently hidden, collapsed, or zero-sized. Expand it so the highlight can lock on.',
      }
    case 'detached':
      return {
        type: 'detached',
        title: 'Target left the page',
        body: 'Navigate back to the screen that contains this element or reopen it before continuing the tour.',
      }
    default:
      return null
  }
}

export const useHudTargetIssue = (
  target: TourTargetInfo,
  options?: UseHudTargetIssueOptions,
): UseHudTargetIssueResult => {
  const delayMs = Math.max(0, options?.delayMs ?? 500)
  const [armed, setArmed] = useState(false)

  const rawIssue = useMemo(
    () => deriveTargetIssue(target),
    [target.isScreen, target.rectSource, target.status, target.visibility],
  )

  useEffect(() => {
    if (!rawIssue) {
      setArmed(false)
      return
    }
    if (!isBrowser) {
      setArmed(true)
      return
    }
    const timeoutId = globalThis.setTimeout(() => setArmed(true), delayMs)
    return () => {
      setArmed(false)
      globalThis.clearTimeout(timeoutId)
    }
  }, [delayMs, rawIssue?.type])

  return {
    issue: armed ? rawIssue : null,
    rawIssue,
  }
}
