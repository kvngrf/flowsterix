import * as NextRouter from 'next/router'
import { useEffect } from 'react'

import { notifyRouteChange } from './routeGating'
import { createPathString } from './utils'

export const useNextPagesRouterTourAdapter = () => {
  const useRouter =
    typeof NextRouter.useRouter === 'function' ? NextRouter.useRouter : null

  if (!useRouter) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[tour][router] useNextPagesRouterTourAdapter requires next/router. Call this hook only in Next.js Pages Router environments.',
      )
    }
    return
  }

  const router = useRouter()
  const pathCandidate =
    typeof router.asPath === 'string' && router.asPath.length > 0
      ? router.asPath
      : router.pathname

  useEffect(() => {
    const path =
      typeof pathCandidate === 'string' && pathCandidate.length > 0
        ? pathCandidate
        : createPathString(router.pathname ?? '/')

    notifyRouteChange(path)
  }, [pathCandidate, router.pathname])
}
