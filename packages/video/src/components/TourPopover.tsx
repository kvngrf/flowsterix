import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING } from '../utils/animations'
import { colors, popover, button } from '../styles/styles'

interface TourPopoverProps {
  title: string
  description: string
  stepNumber: number
  totalSteps: number
  position: { x: number; y: number }
  enterFrame?: number
}

export const TourPopover = ({
  title,
  description,
  stepNumber,
  totalSteps,
  position,
  enterFrame = 0,
}: TourPopoverProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const localFrame = frame - enterFrame

  const enterProgress = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: APPLE_SPRING,
  })

  const opacity = interpolate(enterProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  const scale = interpolate(enterProgress, [0, 1], [0.92, 1])
  const translateY = interpolate(enterProgress, [0, 1], [12, 0])

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 280,
        backgroundColor: popover.background,
        borderRadius: popover.radius,
        border: `1px solid ${popover.border}`,
        boxShadow: popover.shadow,
        padding: '18px 20px',
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        fontFamily: "'SF Pro Display', -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Step dots */}
      <div
        style={{
          display: 'flex',
          gap: 5,
          marginBottom: 14,
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i + 1 === stepNumber ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i + 1 === stepNumber
                  ? colors.accent
                  : `rgba(250, 250, 250, 0.2)`,
              transition: 'width 0.2s',
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: popover.foreground,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 13,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        {description}
      </div>

      {/* Button */}
      <button
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 8,
          backgroundColor: button.primary.bg,
          color: button.primary.color,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {stepNumber === totalSteps ? 'Done' : 'Next'}
      </button>
    </div>
  )
}
