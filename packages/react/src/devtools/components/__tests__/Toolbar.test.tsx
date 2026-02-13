import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Toolbar } from '../Toolbar'

describe('DevTools Toolbar', () => {
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

  it('disables action buttons when no steps are captured', () => {
    render(
      <Toolbar
        mode="idle"
        stepCount={0}
        onToggleGrab={() => {}}
        onExport={() => {}}
        onCopyForAI={async () => {}}
        onReset={() => {}}
      />,
    )

    expect(
      (screen.getByRole('button', { name: /export/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: /copy/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: /reset/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('enables action buttons when steps exist', () => {
    render(
      <Toolbar
        mode="idle"
        stepCount={2}
        onToggleGrab={() => {}}
        onExport={() => {}}
        onCopyForAI={async () => {}}
        onReset={() => {}}
      />,
    )

    expect(
      (screen.getByRole('button', { name: /export/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /copy/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /reset/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })
})
