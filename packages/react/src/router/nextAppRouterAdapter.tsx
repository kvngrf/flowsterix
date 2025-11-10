import * as NextNavigation from 'next/navigation'
import { useEffect } from 'react'

import { notifyRouteChange } from './routeGating'
import { createPathString } from './utils'

export const useNextAppRouterTourAdapter = () => {
  const usePathname =
    typeof NextNavigation.usePathname === 'function'
      ? NextNavigation.usePathname
      : null
  const useSearchParams =
    typeof NextNavigation.useSearchParams === 'function'
      ? NextNavigation.useSearchParams
      : null

  if (!usePathname || !useSearchParams) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[tour][router] useNextAppRouterTourAdapter requires next/navigation. Call this hook only in Next.js App Router environments.',
      )
    }
    return
  }

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchValue = searchParams?.toString() ?? ''

  useEffect(() => {
    if (typeof pathname !== 'string') return

    const path = createPathString(
      pathname,
      searchValue.length > 0 ? `?${searchValue}` : '',
      undefined,
    )

    notifyRouteChange(path)
  }, [pathname, searchValue])
}
