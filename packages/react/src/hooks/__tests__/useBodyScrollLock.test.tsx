import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useBodyScrollLock } from '../useBodyScrollLock'

const Harness = ({ active }: { active: boolean }) => {
  useBodyScrollLock(active)
  return null
}

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  it('locks and restores body overflow', () => {
    const { rerender, unmount } = render(<Harness active={true} />)

    expect(document.body.style.overflow).toBe('hidden')

    rerender(<Harness active={false} />)

    expect(document.body.style.overflow).toBe('')

    unmount()
  })

  it('reference counts nested locks', () => {
    const instanceA = render(<Harness active={true} />)
    const instanceB = render(<Harness active={true} />)

    expect(document.body.style.overflow).toBe('hidden')

    instanceA.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    instanceB.unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
