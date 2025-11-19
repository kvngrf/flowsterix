import type { BackdropInteractionMode, FlowHudOptions } from '@tour/core'
import { useEffect, useMemo } from 'react'

import type { TourTokens } from '../theme/tokens'
import { applyTokensToDocument, mergeTokens } from '../theme/tokens'
import { useTourTokens } from '../theme/TokensProvider'

const ROOT_FONT_SIZE_FALLBACK = 16
let cachedRootFontSize: number | null = null

const getRootFontSize = () => {
  if (typeof window === 'undefined') return ROOT_FONT_SIZE_FALLBACK
  if (cachedRootFontSize !== null) return cachedRootFontSize
  const computed = window.getComputedStyle(document.documentElement).fontSize
  const parsed = Number.parseFloat(computed)
  cachedRootFontSize = Number.isNaN(parsed) ? ROOT_FONT_SIZE_FALLBACK : parsed
  return cachedRootFontSize
}

const toNumericRadius = (value?: number | string): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (trimmed.endsWith('rem')) {
    const numeric = Number.parseFloat(trimmed.slice(0, -3))
    if (Number.isNaN(numeric)) return undefined
    return numeric * getRootFontSize()
  }

  if (trimmed.endsWith('px')) {
    const numeric = Number.parseFloat(trimmed.slice(0, -2))
    return Number.isNaN(numeric) ? undefined : numeric
  }

  const numeric = Number.parseFloat(trimmed)
  return Number.isNaN(numeric) ? undefined : numeric
}

export interface HudPopoverProps {
  offset: number
  role: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaModal: boolean
  width?: number | string
  maxWidth?: number | string
}

export interface UseHudAppearanceOptions {
  overlayPadding?: number
  overlayRadius?: number
  flowHudOptions?: FlowHudOptions | null
  defaultBackdropInteraction?: BackdropInteractionMode
  defaultLockBodyScroll?: boolean
  isActive?: boolean
}

export interface UseHudAppearanceResult {
  tokens: TourTokens
  overlayPadding?: number
  overlayRadius?: number
  backdropInteraction: BackdropInteractionMode
  lockBodyScroll: boolean
  popover: HudPopoverProps
}

const DEFAULT_BACKDROP_MODE: BackdropInteractionMode = 'passthrough'

export const useHudAppearance = (
  options: UseHudAppearanceOptions,
): UseHudAppearanceResult => {
  const {
    overlayPadding,
    overlayRadius,
    flowHudOptions,
    defaultBackdropInteraction = DEFAULT_BACKDROP_MODE,
    defaultLockBodyScroll = false,
    isActive = false,
  } = options

  const tokens = useTourTokens()
  const hudTokenOverrides = flowHudOptions?.tokens
  const hasHudTokenOverrides = Boolean(
    hudTokenOverrides && Object.keys(hudTokenOverrides).length > 0,
  )

  const mergedHudTokens = useMemo(() => {
    if (!hasHudTokenOverrides || !hudTokenOverrides) return null
    return mergeTokens(tokens, hudTokenOverrides)
  }, [hasHudTokenOverrides, hudTokenOverrides, tokens])

  useEffect(() => {
    if (!hasHudTokenOverrides || !isActive || !mergedHudTokens) return
    const cleanup = applyTokensToDocument(mergedHudTokens)
    return cleanup
  }, [hasHudTokenOverrides, isActive, mergedHudTokens])

  const activeTokens =
    hasHudTokenOverrides && mergedHudTokens ? mergedHudTokens : tokens

  const tokenOverlayRadius = toNumericRadius(activeTokens.overlay.radius)

  const resolvedOverlayPadding = overlayPadding ?? undefined
  const resolvedOverlayRadius = overlayRadius ?? tokenOverlayRadius ?? undefined
  const resolvedBackdropInteraction =
    flowHudOptions?.backdrop?.interaction ?? defaultBackdropInteraction
  const resolvedLockBodyScroll =
    flowHudOptions?.behavior?.lockBodyScroll ?? defaultLockBodyScroll

  const popoverOptions = flowHudOptions?.popover

  const popover: HudPopoverProps = {
    offset: popoverOptions?.offset ?? activeTokens.layout.popoverOffset,
    role: popoverOptions?.role ?? 'dialog',
    ariaLabel: popoverOptions?.ariaLabel,
    ariaDescribedBy: popoverOptions?.ariaDescribedBy,
    ariaModal: popoverOptions?.ariaModal ?? false,
    width: popoverOptions?.width,
    maxWidth: popoverOptions?.maxWidth,
  }

  return {
    tokens: activeTokens,
    overlayPadding: resolvedOverlayPadding,
    overlayRadius: resolvedOverlayRadius,
    backdropInteraction: resolvedBackdropInteraction,
    lockBodyScroll: resolvedLockBodyScroll,
    popover,
  }
}
