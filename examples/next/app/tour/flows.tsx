'use client'

import type { ReactNode } from 'react'
import { createFlow } from '@flowsterix/core'

export const demoFlow = createFlow<ReactNode>({
  id: 'next-demo',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: 'screen',
      content: (
        <div>
          <h2>Next.js App Router tour</h2>
          <p>Flowsterix can follow you across pages and layouts.</p>
        </div>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'header',
      target: {
        selector: "[data-tour-target='header']",
        description: 'Header navigation',
      },
      placement: 'bottom',
      content: (
        <div>
          <h3>Navigation stays in sync</h3>
          <p>Click Settings to move to the next step.</p>
        </div>
      ),
      advance: [{ type: 'route', to: '/settings' }],
    },
    {
      id: 'settings',
      route: '/settings',
      target: {
        selector: "[data-tour-target='settings-panel']",
        description: 'Settings panel',
      },
      placement: 'right',
      waitFor: {
        selector: "[data-tour-target='settings-panel']",
        timeout: 6000,
      },
      content: (
        <div>
          <h3>Settings ready</h3>
          <p>The tour resumes when the routed content is available.</p>
        </div>
      ),
      advance: [{ type: 'manual' }],
    },
  ],
})
