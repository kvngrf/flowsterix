import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { ElementInfo } from '../../types'
import { useStepStore } from '../useStepStore'

const STORAGE_KEY = 'flowsterix-devtools-steps'

function createElementInfo(overrides: Partial<ElementInfo> = {}): ElementInfo {
  const element = document.createElement('button')

  return {
    element,
    url: 'https://app.example.com/settings?tab=profile',
    selector: '[data-tour-target="settings"]',
    selectorType: 'data-attr',
    suggestedAttrName: 'data-tour-target',
    tag: 'button',
    text: 'Profile settings',
    className: 'btn btn-primary',
    style: undefined,
    existingAttrs: ['data-tour-target="settings"'],
    componentHierarchy: ['SettingsPage', 'ProfileButton'],
    rect: new DOMRect(10, 20, 120, 40),
    source: undefined,
    ...overrides,
  }
}

describe('useStepStore', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')

    const resetHook = renderHook(() => useStepStore())
    act(() => {
      resetHook.result.current.clearAllSteps()
    })
    resetHook.unmount()
  })

  it('stores captured URL and default step name', () => {
    const { result } = renderHook(() => useStepStore())

    act(() => {
      result.current.addStep({
        info: createElementInfo(),
      })
    })

    expect(result.current.steps).toHaveLength(1)
    expect(result.current.steps[0].url).toBe(
      'https://app.example.com/settings?tab=profile',
    )
    expect(result.current.steps[0].label).toBe('Step 1')
  })

  it('exports user step name and URL for AI workflows', () => {
    const { result } = renderHook(() => useStepStore())

    let createdId = ''
    act(() => {
      const created = result.current.addStep({
        info: createElementInfo(),
      })
      createdId = created.id
    })

    act(() => {
      result.current.updateStep({
        id: createdId,
        updates: { label: 'Open profile menu' },
      })
    })

    const exported = result.current.exportSteps()

    expect(exported.version).toBe('1.1')
    expect(exported.steps[0]).toMatchObject({
      order: 0,
      name: 'Open profile menu',
      url: 'https://app.example.com/settings?tab=profile',
      selector: '[data-tour-target="settings"]',
    })
  })

  it('migrates legacy persisted steps with fallback URL and name', async () => {
    window.history.replaceState({}, '', '/billing?view=summary')

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy-step',
          order: 1,
          selector: '[data-tour-target="billing"]',
          selectorType: 'data-attr',
          elementTag: 'button',
          existingAttrs: [],
          componentHierarchy: [],
          rect: { top: 0, left: 0, width: 100, height: 40 },
          createdAt: 1,
        },
      ]),
    )

    const { result } = renderHook(() => useStepStore())

    await waitFor(() => {
      expect(result.current.steps).toHaveLength(1)
    })

    expect(result.current.steps[0].url).toBe(window.location.href)
    expect(result.current.steps[0].label).toBe('Step 2')
  })
})
