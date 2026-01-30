import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { matchRoute, subscribeToRouteChanges, getCurrentRoutePath } from '../router'

export interface UseRouteMismatchResult {
  isRouteMismatch: boolean
  currentPath: string
  expectedRoute: string | RegExp | undefined
}

export const useRouteMismatch = (
  step: Step<ReactNode> | null,
): UseRouteMismatchResult => {
  const [currentPath, setCurrentPath] = useState(() => getCurrentRoutePath())

  useEffect(() => {
    return subscribeToRouteChanges((path) => {
      setCurrentPath(path)
    })
  }, [])

  const expectedRoute = step?.route
  const isRouteMismatch =
    step !== null &&
    expectedRoute !== undefined &&
    !matchRoute({ pattern: expectedRoute, path: currentPath })

  return {
    isRouteMismatch,
    currentPath,
    expectedRoute,
  }
}
