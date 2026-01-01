import type { ReactNode } from 'react'
import { createFlow } from '@flowsterix/core'

export const demoFlow = createFlow<ReactNode>({
  id: 'react-router-demo',
  version: 1,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      content: (
        <div className="space-y-2">
          <h2>Welcome to the React Router demo</h2>
          <p>
            This tour highlights navigation and a routed settings panel using
            Flowsterix.
          </p>
        </div>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'nav',
      target: {
        selector: "[data-tour-target='nav']",
        description: 'Primary navigation',
      },
      placement: 'bottom',
      content: (
        <div className="space-y-2">
          <h3>Navigation header</h3>
          <p>Jump between pages while the tour keeps state in sync.</p>
          <p>Click Settings to navigate, then hit Next.</p>
        </div>
      ),
      advance: [{ type: 'route', to: '/settings' }],
    },
    {
      id: 'settings-panel',
      route: '/settings',
      target: {
        selector: "[data-tour-target='settings-card']",
        description: 'Settings card',
      },
      placement: 'right',
      waitFor: {
        selector: "[data-tour-target='settings-card']",
        timeout: 6000,
      },
      content: (
        <div className="space-y-2">
          <h3>Settings ready</h3>
          <p>This step waits for the Settings route and DOM target.</p>
        </div>
      ),
      advance: [{ type: 'manual' }],
    },
  ],
})
