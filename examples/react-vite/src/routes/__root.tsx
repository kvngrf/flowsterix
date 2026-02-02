import { DevToolsProvider } from '@flowsterix/react/devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'

import Header from '../components/Header'
import { TourHUD } from '../components/tour-hud'
import { TourProvider } from '../components/tour-provider'
import { demoAnalytics } from '../tour/analytics'
import { demoFlows } from '../tour/flows'
import { TanStackRouterSync } from '../tour/routerBridge'

import appCss from '../styles.css?url'

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
      <body className="bg-slate-900">
        <TourProvider
          flows={demoFlows}
          storageNamespace="flowsterix-demo"
          autoDetectReducedMotion
          defaultDebug={false}
          analytics={demoAnalytics}
          backdropInteraction="block"
          lockBodyScroll
        >
          <DevToolsProvider enabled={process.env.NODE_ENV === 'development'}>
            <TanStackRouterSync />
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
            <TourHUD controls={{ skipMode: 'hold' }} />
          </DevToolsProvider>
        </TourProvider>
        <Scripts />
      </body>
    </html>
  )
}
