import { interpolate, useCurrentFrame } from 'remotion'

interface GlowRingProps {
  x: number
  y: number
  width: number
  height: number
  radius?: number
  color?: string
  pulseSpeed?: number
}

export const GlowRing = ({
  x,
  y,
  width,
  height,
  radius = 16,
  color = 'rgba(34, 211, 238, 0.6)',
  pulseSpeed = 60,
}: GlowRingProps) => {
  const frame = useCurrentFrame()

  const pulse = Math.sin((frame / pulseSpeed) * Math.PI * 2)
  const glowIntensity = interpolate(pulse, [-1, 1], [0.4, 1])
  const spreadRadius = interpolate(pulse, [-1, 1], [4, 12])

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: radius,
        boxShadow: `
          inset 0 0 0 2px ${color},
          0 0 ${spreadRadius}px ${spreadRadius / 2}px ${color.replace('0.6', String(glowIntensity * 0.4))}
        `,
        pointerEvents: 'none',
      }}
    />
  )
}
