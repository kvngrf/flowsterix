import { render } from '@testing-library/react'
import { act, useLayoutEffect, useRef, useState } from 'react'
import { describe, expect, it } from 'vitest'

import type { TourTargetInfo } from '../../hooks/useTourTarget'
import { TourFocusManager } from '../TourFocusManager'

const createTargetInfo = (element: Element | null): TourTargetInfo => ({
  element,
  rect: null,
  lastResolvedRect: null,
  isScreen: false,
  status: 'ready',
  stepId: 'step-1',
  lastUpdated: Date.now(),
  visibility: 'visible',
  rectSource: 'live',
})

const AutoFocusButton = () => {
  const ref = useRef<HTMLButtonElement | null>(null)
  useLayoutEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <button ref={ref} type="button">
      Auto focus target
    </button>
  )
}

const AutoFocusPopover = ({
  active,
  onNodeChange,
}: {
  active: boolean
  onNodeChange: (node: HTMLDivElement | null) => void
}) => {
  const setRef = (node: HTMLDivElement | null) => {
    onNodeChange(node)
  }

  useLayoutEffect(() => {
    return () => {
      onNodeChange(null)
    }
  }, [onNodeChange])

  if (!active) return null

  return (
    <div ref={setRef}>
      <AutoFocusButton />
    </div>
  )
}

const FocusManagerHarness = ({
  active,
  target,
}: {
  active: boolean
  target: TourTargetInfo
}) => {
  const [popoverNode, setPopoverNode] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <TourFocusManager active={active} target={target} popoverNode={popoverNode} />
      <AutoFocusPopover active={active} onNodeChange={setPopoverNode} />
    </>
  )
}

describe('TourFocusManager', () => {
  it('restores focus to the element that was active before the tour opened even when the popover steals focus synchronously', async () => {
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.textContent = 'Launch tour'
    document.body.append(trigger)
    trigger.focus()

    const targetElement = document.createElement('div')
    document.body.append(targetElement)

    const targetInfo = createTargetInfo(targetElement)

    const { rerender, unmount } = render(
      <FocusManagerHarness active={false} target={targetInfo} />,
    )

    act(() => {
      rerender(<FocusManagerHarness active target={targetInfo} />)
    })

    expect(document.activeElement?.textContent).toBe('Auto focus target')

    act(() => {
      rerender(<FocusManagerHarness active={false} target={targetInfo} />)
    })

    await Promise.resolve()

    expect(document.activeElement).toBe(trigger)

    unmount()
    trigger.remove()
    targetElement.remove()
  })
})
