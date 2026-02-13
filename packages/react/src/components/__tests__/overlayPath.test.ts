import { describe, expect, it } from 'vitest'

import { buildOverlayCutoutPath } from '../overlayPath'

describe('buildOverlayCutoutPath', () => {
  it('builds an even-odd path with rounded cutout arcs', () => {
    const path = buildOverlayCutoutPath({
      viewportWidth: 390,
      viewportHeight: 844,
      rect: {
        top: 120,
        left: 80,
        width: 220,
        height: 140,
        radius: 16,
      },
    })

    expect(path).toContain('M0 0H390V844H0Z')
    expect(path).toContain('A16 16 0 0 1')
  })

  it('falls back to rectangular inner cutout when radius is zero', () => {
    const path = buildOverlayCutoutPath({
      viewportWidth: 390,
      viewportHeight: 844,
      rect: {
        top: 100,
        left: 40,
        width: 200,
        height: 100,
        radius: 0,
      },
    })

    expect(path).toContain('M0 0H390V844H0Z')
    expect(path).toContain('M40 100H240V200H40Z')
    expect(path).not.toContain('A0 0')
  })
})
