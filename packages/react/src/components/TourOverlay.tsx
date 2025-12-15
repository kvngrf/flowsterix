import type { BackdropInteractionMode } from '@flowsterix/core'

import { useTourOverlay } from '../hooks/useTourOverlay'
import type { TourTargetInfo } from '../hooks/useTourTarget'
import type { TourTokenPath } from '../theme/tokens'
import { OverlayBackdrop } from './OverlayBackdrop'

export interface TourOverlayProps {
  target: TourTargetInfo
  padding?: number
  radius?: number
  color?: string
  colorClassName?: string
  opacity?: number
  shadow?: string
  shadowToken?: TourTokenPath
  shadowClassName?: string
  zIndex?: number
  edgeBuffer?: number
  blurAmount?: number
  interactionMode?: BackdropInteractionMode
}

export const TourOverlay = ({
  target,
  padding = 12,
  radius = 12,
  color,
  colorClassName,
  opacity = 1,
  shadow,
  shadowToken,
  shadowClassName,
  zIndex = 1000,
  edgeBuffer = 8,
  blurAmount,
  interactionMode = 'passthrough',
}: TourOverlayProps) => {
  const overlayState = useTourOverlay({
    target,
    padding,
    radius,
    edgeBuffer,
    interactionMode,
  })
  return (
    <OverlayBackdrop
      overlay={overlayState}
      zIndex={zIndex}
      color={color}
      colorClassName={colorClassName}
      opacity={opacity}
      shadow={shadow}
      shadowToken={shadowToken}
      shadowClassName={shadowClassName}
      blurAmount={blurAmount}
      ariaHidden={target.status !== 'ready'}
    />
  )
}
