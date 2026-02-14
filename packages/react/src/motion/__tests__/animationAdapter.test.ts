import { describe, expect, it } from 'vitest'

import {
  defaultAnimationAdapter,
  tweenAnimationAdapter,
} from '../animationAdapter'

describe('animationAdapter defaults', () => {
  it('uses longer popover content transition by default', () => {
    expect(defaultAnimationAdapter.transitions.popoverContent).toMatchObject({
      duration: 0.4,
      ease: 'easeOut',
    })
  })

  it('keeps tween adapter popover content timing in sync with default', () => {
    expect(tweenAnimationAdapter.transitions.popoverContent).toEqual(
      defaultAnimationAdapter.transitions.popoverContent,
    )
  })
})
