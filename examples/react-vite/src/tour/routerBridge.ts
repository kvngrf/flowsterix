import type { AnyRouter } from '@tanstack/react-router'

let currentRouter: AnyRouter | null = null

export const setTourRouter = (router: AnyRouter | null) => {
  currentRouter = router
}

export const getTourRouter = (): AnyRouter | null => {
  return currentRouter
}
