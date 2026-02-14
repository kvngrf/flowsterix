import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import type { AnimationAdapter } from '../animationAdapter'
import {
  AnimationAdapterProvider,
  defaultAnimationAdapter,
} from '../animationAdapter'
import { useHudMotion } from '../useHudMotion'

describe('useHudMotion', () => {
  it('falls back to the default popover content transition when adapter omits it', () => {
    const adapterWithoutPopoverContent: AnimationAdapter = {
      ...defaultAnimationAdapter,
      transitions: {
        ...defaultAnimationAdapter.transitions,
        popoverContent: undefined,
      },
    }

    const wrapper = ({ children }: PropsWithChildren) => (
      <AnimationAdapterProvider adapter={adapterWithoutPopoverContent}>
        {children}
      </AnimationAdapterProvider>
    )

    const { result } = renderHook(() => useHudMotion(), { wrapper })

    expect(result.current.transitions.popoverContent).toMatchObject({
      duration: 0.25,
      ease: [0.25, 1, 0.5, 1],
    })
  })
})
