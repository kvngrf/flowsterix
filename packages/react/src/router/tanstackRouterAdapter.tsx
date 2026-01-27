import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { notifyRouteChange } from './routeGating'
import { createPathString } from './utils'

// Re-export TanStack Router sync utilities for convenience
export {
  getTanStackRouter,
  getTourRouter,
  setTanStackRouter,
  setTourRouter,
  TanStackRouterSync,
} from './tanstackRouterSync'
export type { TanStackRouterSyncProps } from './tanstackRouterSync'

export const useTanStackRouterTourAdapter = () => {
  const location = useRouterState({
    select: (state) => state.location,
  })

  useEffect(() => {
    const resolvedPathname =
      typeof location.pathname === 'string' && location.pathname.length > 0
        ? location.pathname
        : '/'
    const resolvedSearch =
      'searchStr' in location && typeof location.searchStr === 'string'
        ? location.searchStr
        : typeof location.search === 'string'
          ? location.search
          : ''
    const resolvedHash = typeof location.hash === 'string' ? location.hash : ''

    const path =
      typeof location.href === 'string' && location.href.length > 0
        ? location.href
        : createPathString(resolvedPathname, resolvedSearch, resolvedHash)

    notifyRouteChange(path)
  }, [location])
}
