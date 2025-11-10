import { useEffect } from 'react'
import * as ReactRouterDom from 'react-router-dom'

import { notifyRouteChange } from './routeGating'
import { createPathString } from './utils'

export const useReactRouterTourAdapter = () => {
  const useLocation =
    typeof ReactRouterDom.useLocation === 'function'
      ? ReactRouterDom.useLocation
      : null

  if (!useLocation) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[tour][router] useReactRouterTourAdapter requires react-router-dom. Call this hook only in React Router environments.',
      )
    }
    return
  }

  const location = useLocation()

  useEffect(() => {
    const path = createPathString(
      location.pathname,
      location.search,
      location.hash,
    )
    notifyRouteChange(path)
  }, [location.pathname, location.search, location.hash])
}
