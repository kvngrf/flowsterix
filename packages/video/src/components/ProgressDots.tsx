import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { FLOWSTERIX_SPRING } from '../utils/animations'

interface ProgressDotsProps {
  current: number
  total: number
  color?: string
}

export const ProgressDots = ({
  current,
  total,
  color = '#38bdf8',
}: ProgressDotsProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 === current
        const isPast = i + 1 < current

        const progress = spring({
          frame,
          fps,
          config: FLOWSTERIX_SPRING,
        })

        const scale = isActive
          ? interpolate(progress, [0, 1], [1, 1.25])
          : 1

        const width = isActive ? 24 : 10

        return (
          <div
            key={i}
            style={{
              width,
              height: 10,
              borderRadius: 5,
              backgroundColor: isActive || isPast ? color : `${color}33`,
              transform: `scale(${scale})`,
              transition: 'width 200ms ease, background-color 200ms ease',
            }}
          />
        )
      })}
    </div>
  )
}
