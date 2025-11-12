import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  TourHUD,
  TourProvider,
  useTanStackRouterTourAdapter,
} from '@tour/react'
import '@tour/react/styles.css'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import Header from '../components/Header'
import { demoFlows } from '../tour/flows'
import { setTourRouter } from '../tour/routerBridge'

import appCss from '../styles.css?url'

function RouteSync() {
  const router = useRouter()
  useTanStackRouterTourAdapter()
  useEffect(() => {
    setTourRouter(router)
    return () => {
      setTourRouter(null)
    }
  }, [router])
  return null
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TourProvider
          flows={demoFlows}
          storageNamespace="flowster-demo"
          autoDetectReducedMotion
          defaultDebug={false}
        >
          <RouteSync />
          <Header />
          {children}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <TourHUD />
        </TourProvider>
        <Scripts />
      </body>
    </html>
  )
}
