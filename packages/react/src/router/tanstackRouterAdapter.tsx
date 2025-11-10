import type { RouterLocation } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { notifyRouteChange } from './routeGating'
import { createPathString } from './utils'

export const useTanStackRouterTourAdapter = () => {
  const location = useRouterState<RouterLocation>({
    select: (state) => state.location,
  })

  useEffect(() => {
    const path =
      typeof location.href === 'string' && location.href.length > 0
        ? location.href
        : createPathString(
            location.pathname,
            (location as { searchStr?: string }).searchStr ?? location.search,
            location.hash,
          )

    notifyRouteChange(path)
  }, [location.href, location.pathname, location.hash, location.search])
}
