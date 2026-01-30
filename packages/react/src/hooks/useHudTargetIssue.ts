import { useEffect, useMemo, useState } from 'react'

import type { TourLabels } from '../labels'
import { useTourLabels } from '../labels'
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

const deriveTargetIssue = (params: {
  target: TourTargetInfo
  labels: TourLabels
}): HudTargetIssue | null => {
  const { target, labels } = params
  if (target.isScreen) return null
  if (target.status === 'idle') return null
  switch (target.visibility) {
    case 'missing':
      return {
        type: 'missing',
        title: labels.targetIssue.missingTitle,
        body: labels.targetIssue.missingBody,
        hint:
          target.rectSource === 'stored'
            ? labels.targetIssue.missingHint
            : undefined,
      }
    case 'hidden':
      return {
        type: 'hidden',
        title: labels.targetIssue.hiddenTitle,
        body: labels.targetIssue.hiddenBody,
        hint:
          target.rectSource === 'stored'
            ? labels.targetIssue.hiddenHint
            : undefined,
      }
    case 'detached':
      return {
        type: 'detached',
        title: labels.targetIssue.detachedTitle,
        body: labels.targetIssue.detachedBody,
      }
    default:
      return null
  }
}

export const useHudTargetIssue = (
  target: TourTargetInfo,
  options?: UseHudTargetIssueOptions,
): UseHudTargetIssueResult => {
  const labels = useTourLabels()
  const delayMs = Math.max(0, options?.delayMs ?? 500)
  const [armed, setArmed] = useState(false)

  const rawIssue = useMemo(
    () => deriveTargetIssue({ target, labels }),
    [target.isScreen, target.rectSource, target.status, target.visibility, labels],
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
