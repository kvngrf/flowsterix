import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING } from '../utils/animations'
import { overlay } from '../styles/styles'

interface TargetRect {
  x: number
  y: number
  width: number
  height: number
}

interface SpotlightOverlayProps {
  targetRect: TargetRect
  previousRect?: TargetRect
  padding?: number
  transitionStartFrame?: number
}

export const SpotlightOverlay = ({
  targetRect,
  previousRect,
  padding = 12,
  transitionStartFrame = 0,
}: SpotlightOverlayProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const from = previousRect || targetRect
  const transitionFrame = frame - transitionStartFrame

  const progress = spring({
    frame: Math.max(0, transitionFrame),
    fps,
    config: APPLE_SPRING,
  })

  const x = interpolate(progress, [0, 1], [from.x - padding, targetRect.x - padding])
  const y = interpolate(progress, [0, 1], [from.y - padding, targetRect.y - padding])
  const width = interpolate(
    progress,
    [0, 1],
    [from.width + padding * 2, targetRect.width + padding * 2]
  )
  const height = interpolate(
    progress,
    [0, 1],
    [from.height + padding * 2, targetRect.height + padding * 2]
  )

  const radius = overlay.radius

  const maskId = 'spotlight-mask'

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={radius}
              ry={radius}
              fill="black"
            />
          </mask>
        </defs>

        {/* Backdrop */}
        <rect
          width="100%"
          height="100%"
          fill={overlay.background}
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Glow ring using div for box-shadow support */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          borderRadius: radius,
          boxShadow: overlay.ringShadow,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}
