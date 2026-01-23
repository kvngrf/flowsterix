/**
 * Async Content Example
 *
 * Demonstrates waitFor patterns for dynamically loaded content.
 */

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import type { ReactNode } from 'react'

export const asyncContentFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'async-demo',
  version: { major: 1, minor: 0 },
  steps: [
    // Wait for element to appear
    {
      id: 'wait-for-data',
      target: { selector: '[data-tour-target="api-result"]' },
      waitFor: {
        selector: '[data-tour-target="api-result"]',
        timeout: 8000, // Max wait time
      },
      advance: [{ type: 'manual' }],
      content: (
        <div>
          <h3>Data Loaded!</h3>
          <p>The tour waited for the API response before showing this step.</p>
        </div>
      ),
    },

    // Wait for predicate condition
    {
      id: 'wait-for-condition',
      target: { selector: '[data-tour-target="processed-data"]' },
      waitFor: {
        predicate: () => {
          const el = document.querySelector('[data-tour-target="processed-data"]')
          return el?.getAttribute('data-ready') === 'true'
        },
        pollMs: 250,
        timeout: 10000,
      },
      advance: [{ type: 'manual' }],
      content: (
        <div>
          <h3>Processing Complete</h3>
          <p>The data has been processed and is ready for review.</p>
        </div>
      ),
    },

    // Wait with custom subscription
    {
      id: 'wait-for-event',
      target: { selector: '[data-tour-target="realtime-data"]' },
      waitFor: {
        subscribe: (ctx) => {
          const handler = () => ctx.notify(true)
          window.addEventListener('realtime-update', handler)
          return () => window.removeEventListener('realtime-update', handler)
        },
        timeout: 15000,
      },
      advance: [{ type: 'manual' }],
      content: (
        <div>
          <h3>Real-time Update Received</h3>
          <p>The step activated when the custom event fired.</p>
        </div>
      ),
    },

    // Async predicate with API check
    {
      id: 'wait-for-api',
      target: { selector: '[data-tour-target="dashboard"]' },
      waitFor: {
        predicate: async () => {
          try {
            const response = await fetch('/api/status')
            const data = await response.json()
            return data.ready === true
          } catch {
            return false
          }
        },
        pollMs: 1000,
        timeout: 30000,
      },
      advance: [{ type: 'manual' }],
      content: (
        <div>
          <h3>System Ready</h3>
          <p>All services are online and ready.</p>
        </div>
      ),
    },
  ],
})

// Example components

export function ApiResults() {
  // Simulates async data loading
  const [data, setData] = useState<string[] | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(['Item 1', 'Item 2', 'Item 3'])
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <ul data-tour-target="api-result">
      {data.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function ProcessedData() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      data-tour-target="processed-data"
      data-ready={ready ? 'true' : 'false'}
    >
      {ready ? 'Data processed!' : 'Processing...'}
    </div>
  )
}

import { useEffect, useState } from 'react'
