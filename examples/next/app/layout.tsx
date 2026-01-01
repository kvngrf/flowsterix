import type { ReactNode } from 'react'
import './globals.css'

import { TourProviders } from './tour/providers'

export const metadata = {
  title: 'Flowsterix Next Demo',
  description: 'Flowsterix tours with Next.js App Router',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TourProviders>{children}</TourProviders>
      </body>
    </html>
  )
}
