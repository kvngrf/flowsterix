import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackRouterSync, TourHUD, TourProvider } from '@tour/react'
import '@tour/react/styles.css'
import type { ReactNode } from 'react'

import Header from '../components/Header'
import { demoAnalytics } from '../tour/analytics'
import { demoFlows } from '../tour/flows'
import { TourThemeProvider, useTourTheme } from '../tour/theme'

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
        <TourThemeProvider>
          <TourThemeAwareShell>{children}</TourThemeAwareShell>
        </TourThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}

const TourThemeAwareShell = ({ children }: { children: ReactNode }) => {
  const { tokensOverride } = useTourTheme()

  return (
    <TourProvider
      flows={demoFlows}
      storageNamespace="flowster-demo"
      autoDetectReducedMotion
      defaultDebug={false}
      analytics={demoAnalytics}
      tokens={tokensOverride}
      backdropInteraction="block"
    >
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
      <TourHUD />
    </TourProvider>
  )
}
