import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  TourHUD,
  TourProvider,
  useTanStackRouterTourAdapter,
} from '@tour/react'
import '@tour/react/styles.css'

import Header from '../components/Header'
import { demoFlows } from '../tour/flows'

import appCss from '../styles.css?url'

function RouteSync() {
  useTanStackRouterTourAdapter()
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

function RootDocument({ children }: { children: React.ReactNode }) {
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
