'use client'

import { Suspense } from 'react'
import { useNextAppRouterTourAdapter } from '@flowsterix/react/router/next-app'

const RouterSync = () => {
  useNextAppRouterTourAdapter()
  return null
}

export const NextRouterSync = () => (
  <Suspense fallback={null}>
    <RouterSync />
  </Suspense>
)
