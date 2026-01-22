import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING, TEXT_SPRING } from '../utils/animations'
import { colors } from '../styles/styles'

export const IntroScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Logo scales in fast
  const logoProgress = spring({
    frame,
    fps,
    config: APPLE_SPRING,
  })

  // Text reveals immediately after
  const textProgress = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: TEXT_SPRING,
  })

  const logoScale = interpolate(logoProgress, [0, 1], [0.6, 1])
  const logoOpacity = interpolate(logoProgress, [0, 0.2], [0, 1], { extrapolateRight: 'clamp' })

  const textY = interpolate(textProgress, [0, 1], [24, 0])
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
      {/* Logo */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          backgroundColor: colors.foreground,
          marginBottom: 28,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      />

      {/* Brand name - big and bold */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: colors.foreground,
          letterSpacing: '-0.04em',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        flowsterix
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 12,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        Guide users through your app
      </div>
    </AbsoluteFill>
  )
}
