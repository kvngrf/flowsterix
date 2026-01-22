import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING, TEXT_SPRING } from '../utils/animations'
import { DEFAULT_THEME } from '../styles/themes'

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
        backgroundColor: DEFAULT_THEME.background,
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
          color: DEFAULT_THEME.foreground,
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
          backgroundColor: DEFAULT_THEME.card.background,
          borderRadius: 12,
          padding: '18px 36px',
          border: `1px solid ${DEFAULT_THEME.border}`,
          opacity: interpolate(codeProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `scale(${interpolate(codeProgress, [0, 1], [0.95, 1])})`,
        }}
      >
        <code
          style={{
            fontSize: 22,
            color: DEFAULT_THEME.foreground,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          }}
        >
          <span style={{ color: DEFAULT_THEME.muted }}>npm install</span>{' '}
          <span style={{ color: DEFAULT_THEME.success }}>@flowsterix/react</span>
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
          color: DEFAULT_THEME.muted,
        }}
      >
        flowsterix
      </div>
    </AbsoluteFill>
  )
}
