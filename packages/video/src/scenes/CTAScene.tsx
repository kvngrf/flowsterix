import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING, TEXT_SPRING } from '../utils/animations'
import { colors, card } from '../styles/styles'

export const CTAScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const textProgress = spring({
    frame,
    fps,
    config: TEXT_SPRING,
  })

  const codeProgress = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: APPLE_SPRING,
  })

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
      {/* CTA text */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: colors.foreground,
          marginBottom: 32,
          letterSpacing: '-0.03em',
          opacity: interpolate(textProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(textProgress, [0, 1], [16, 0])}px)`,
        }}
      >
        Start in seconds
      </div>

      {/* Install command */}
      <div
        style={{
          backgroundColor: card.background,
          borderRadius: 12,
          padding: '18px 36px',
          border: `1px solid ${colors.border}`,
          opacity: interpolate(codeProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `scale(${interpolate(codeProgress, [0, 1], [0.95, 1])})`,
        }}
      >
        <code
          style={{
            fontSize: 22,
            color: colors.foreground,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          }}
        >
          <span style={{ color: colors.muted }}>npm install</span>{' '}
          <span style={{ color: colors.success }}>@flowsterix/react</span>
        </code>
      </div>

      {/* Logo watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          opacity: 0.3,
          fontSize: 18,
          fontWeight: 600,
          color: colors.muted,
        }}
      >
        flowsterix
      </div>
    </AbsoluteFill>
  )
}
