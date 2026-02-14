import { describe, expect, it } from 'vitest'

import {
  defaultAnimationAdapter,
  tweenAnimationAdapter,
} from '../animationAdapter'

describe('animationAdapter defaults', () => {
  it('uses longer popover content transition by default', () => {
    expect(defaultAnimationAdapter.transitions.popoverContent).toMatchObject({
      duration: 0.25,
      ease: [0.25, 1, 0.5, 1],
    })
  })

  it('keeps tween adapter popover content timing in sync with default', () => {
    expect(tweenAnimationAdapter.transitions.popoverContent).toEqual(
      defaultAnimationAdapter.transitions.popoverContent,
    )
  })
})
