import type { Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'

import { getCurrentRoutePath, matchRoute, subscribeToRouteChanges } from '../router'

export interface UseRouteMismatchResult {
  isRouteMismatch: boolean
  currentPath: string
  expectedRoute: string | RegExp | undefined
}

/**
 * Subscribe adapter for useSyncExternalStore.
 * subscribeToRouteChanges expects (path: string) => void but
 * useSyncExternalStore provides () => void — we ignore the path
 * argument and let React re-read the snapshot via getSnapshot.
 */
const subscribeForSync = (onStoreChange: () => void) => {
  return subscribeToRouteChanges(() => onStoreChange())
}

const getServerPath = () => '/'

export const useRouteMismatch = (
  step: Step<ReactNode> | null,
): UseRouteMismatchResult => {
  // useSyncExternalStore reads window.location synchronously during render,
  // eliminating the one-render lag that useState + useEffect had. This
  // prevents a spurious route-mismatch pause when next() and the route
  // change are processed in the same notifyRouteChange callback.
  const currentPath = useSyncExternalStore(
    subscribeForSync,
    getCurrentRoutePath,
    getServerPath,
  )

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
