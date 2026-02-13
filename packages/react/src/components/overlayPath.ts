import type { TourOverlayRect } from '../hooks/useTourOverlay'

export const buildOverlayCutoutPath = (params: {
  viewportWidth: number
  viewportHeight: number
  rect: TourOverlayRect
}) => {
  const { viewportWidth, viewportHeight, rect } = params
  const x = rect.left
  const y = rect.top
  const width = rect.width
  const height = rect.height
  const radius = Math.max(0, Math.min(rect.radius, width / 2, height / 2))

  const outerPath = `M0 0H${viewportWidth}V${viewportHeight}H0Z`

  if (radius <= 0) {
    const innerRect = `M${x} ${y}H${x + width}V${y + height}H${x}Z`
    return `${outerPath} ${innerRect}`
  }

  const innerRoundedRect = [
    `M${x + radius} ${y}`,
    `H${x + width - radius}`,
    `A${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
    `V${y + height - radius}`,
    `A${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}`,
    `H${x + radius}`,
    `A${radius} ${radius} 0 0 1 ${x} ${y + height - radius}`,
    `V${y + radius}`,
    `A${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    'Z',
  ].join(' ')

  return `${outerPath} ${innerRoundedRect}`
}
