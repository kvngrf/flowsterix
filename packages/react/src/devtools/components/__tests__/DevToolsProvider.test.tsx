import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DevToolsProvider } from '../../DevToolsProvider'

describe('DevToolsProvider', () => {
  beforeEach(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }),
      })
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('collapses to a bubble and expands back to the panel', async () => {
    render(
      <DevToolsProvider enabled>
        <div>app</div>
      </DevToolsProvider>,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-devtools-host]')).toBeTruthy()
    })

    const host = document.querySelector('[data-devtools-host]') as HTMLElement
    const shadow = host.shadowRoot as ShadowRoot

    const collapseButton = shadow.querySelector(
      'button[title="Collapse to bubble (Ctrl+Shift+M)"]',
    ) as HTMLButtonElement

    expect(collapseButton).toBeTruthy()

    fireEvent.click(collapseButton)

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Open DevTools (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })

    const openButton = shadow.querySelector(
      'button[title="Open DevTools (Ctrl+Shift+M)"]',
    ) as HTMLButtonElement

    fireEvent.click(openButton)

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Collapse to bubble (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })
  })

  it('opens the collapsed bubble when tapping the header', async () => {
    render(
      <DevToolsProvider enabled>
        <div>app</div>
      </DevToolsProvider>,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-devtools-host]')).toBeTruthy()
    })

    const host = document.querySelector('[data-devtools-host]') as HTMLElement
    const shadow = host.shadowRoot as ShadowRoot

    const collapseButton = shadow.querySelector(
      'button[title="Collapse to bubble (Ctrl+Shift+M)"]',
    ) as HTMLButtonElement

    fireEvent.click(collapseButton)

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Open DevTools (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })

    const header = shadow.querySelector('[data-devtools-header]') as HTMLElement

    fireEvent.pointerDown(header, { clientX: 120, clientY: 120, pointerId: 1 })
    fireEvent.pointerUp(header, { clientX: 120, clientY: 120, pointerId: 1 })

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Collapse to bubble (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })
  })

  it('drags the collapsed bubble without expanding the panel', async () => {
    render(
      <DevToolsProvider enabled>
        <div>app</div>
      </DevToolsProvider>,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-devtools-host]')).toBeTruthy()
    })

    const host = document.querySelector('[data-devtools-host]') as HTMLElement
    const shadow = host.shadowRoot as ShadowRoot

    const collapseButton = shadow.querySelector(
      'button[title="Collapse to bubble (Ctrl+Shift+M)"]',
    ) as HTMLButtonElement

    fireEvent.click(collapseButton)

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Open DevTools (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })

    const header = shadow.querySelector('[data-devtools-header]') as HTMLElement
    const shell = shadow.querySelector('[data-devtools-panel-shell]') as HTMLElement

    fireEvent.pointerDown(header, { clientX: 120, clientY: 120, pointerId: 1 })
    fireEvent.pointerMove(header, { clientX: 166, clientY: 150, pointerId: 1 })
    fireEvent.pointerUp(header, { clientX: 166, clientY: 150, pointerId: 1 })

    await waitFor(() => {
      expect(
        shadow.querySelector('button[title="Open DevTools (Ctrl+Shift+M)"]'),
      ).toBeTruthy()
    })

    await waitFor(() => {
      const inlineStyle = shell.getAttribute('style') ?? ''
      expect(inlineStyle).toContain('right: 8px')
      expect(inlineStyle).toContain('top: 46px')
    })
  })
})
