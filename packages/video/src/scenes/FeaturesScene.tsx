import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { APPLE_SPRING, TEXT_SPRING } from '../utils/animations'
import { colors, card } from '../styles/styles'

const FEATURES = [
  { title: 'Smooth Animations', icon: '✨' },
  { title: 'Keyboard Navigation', icon: '⌨️' },
  { title: 'Fully Accessible', icon: '♿' },
  { title: 'Router Integration', icon: '🔗' },
]

export const FeaturesScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleProgress = spring({
    frame,
    fps,
    config: TEXT_SPRING,
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
      {/* Title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: colors.foreground,
          marginBottom: 48,
          letterSpacing: '-0.03em',
          opacity: interpolate(titleProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [16, 0])}px)`,
        }}
      >
        Production Ready
      </div>

      {/* Features row */}
      <div
        style={{
          display: 'flex',
          gap: 20,
        }}
      >
        {FEATURES.map((feature, i) => {
          const delay = 8 + i * 4 // Tighter stagger
          const cardProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: APPLE_SPRING,
          })

          const opacity = interpolate(cardProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
          const scale = interpolate(cardProgress, [0, 1], [0.9, 1])

          return (
            <div
              key={feature.title}
              style={{
                backgroundColor: card.background,
                borderRadius: 16,
                padding: '24px 32px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <span style={{ fontSize: 28 }}>{feature.icon}</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.foreground,
                }}
              >
                {feature.title}
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
