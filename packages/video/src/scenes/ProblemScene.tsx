import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING, TEXT_SPRING } from '../utils/animations'
import { colors } from '../styles/styles'

export const ProblemScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Big number pops in
  const numberProgress = spring({
    frame,
    fps,
    config: APPLE_SPRING,
  })

  // Text follows fast
  const textProgress = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: TEXT_SPRING,
  })

  const numberScale = interpolate(numberProgress, [0, 1], [0.7, 1])
  const numberOpacity = interpolate(numberProgress, [0, 0.2], [0, 1], { extrapolateRight: 'clamp' })

  const textY = interpolate(textProgress, [0, 1], [20, 0])
  const textOpacity = interpolate(textProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'SF Pro Display', -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Big dramatic number */}
      <div
        style={{
          fontSize: 180,
          fontWeight: 700,
          color: colors.destructive,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          transform: `scale(${numberScale})`,
          opacity: numberOpacity,
        }}
      >
        73%
      </div>

      {/* Statement */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: colors.foreground,
          marginTop: 20,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        of users abandon onboarding
      </div>

      {/* Subtext */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 12,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        Without proper guidance
      </div>
    </AbsoluteFill>
  )
}
