'use client'

import { TourHUD } from '@/components/tour-hud'
import { TourProvider } from '@/components/tour-provider'
import type { ReactNode } from 'react'

import { demoFlow } from './flows'
import { NextRouterSync } from './router-sync'

export const TourProviders = ({ children }: { children: ReactNode }) => {
  return (
    <TourProvider flows={[demoFlow]} storageNamespace="flowsterix-next-demo">
      <NextRouterSync />
      <TourHUD overlay={{ showRing: true }} controls={{ skipMode: 'hold' }} />
      {children}
    </TourProvider>
  )
}
