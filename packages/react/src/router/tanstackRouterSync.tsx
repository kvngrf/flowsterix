import * as TanStackRouter from '@tanstack/react-router'
import { useEffect } from 'react'

import { useTanStackRouterTourAdapter } from './tanstackRouterAdapter'

type RouterLike = {
  state: { location: { pathname: string } }
  navigate: (opts: { to: string }) => Promise<unknown>
}

let currentRouter: RouterLike | null = null

export const setTourRouter = (router: RouterLike | null) => {
  currentRouter = router
}

export const setTanStackRouter = setTourRouter

export const getTourRouter = (): RouterLike | null => {
  return currentRouter
}

export const getTanStackRouter = getTourRouter

export interface TanStackRouterSyncProps {
  onRouterAvailable?: (router: RouterLike | null) => void
}

export const TanStackRouterSync = ({
  onRouterAvailable,
}: TanStackRouterSyncProps) => {
  const useRouter = (
    TanStackRouter as {
      useRouter?: () => RouterLike
    }
  ).useRouter

  if (typeof useRouter !== 'function') {
    if (typeof console !== 'undefined') {
      console.warn(
        '[tour][router] TanStackRouterSync requires @tanstack/react-router. Call this component only inside TanStack Router environments.',
      )
    }
    return null
  }

  useTanStackRouterTourAdapter()

  const router = useRouter()

  useEffect(() => {
    setTourRouter(router)
    onRouterAvailable?.(router)

    return () => {
      if (getTourRouter() === router) {
        setTourRouter(null)
      }
      onRouterAvailable?.(null)
    }
  }, [router, onRouterAvailable])

  return null
}
