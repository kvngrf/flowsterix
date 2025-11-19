import type { BackdropInteractionMode, Step } from '@tour/core'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { useTour } from '../context'
import { useBodyScrollLock } from './useBodyScrollLock'
import type {
  HudPopoverProps,
  UseHudAppearanceResult,
} from './useHudAppearance'
import { useHudAppearance } from './useHudAppearance'
import type { UseHudDescriptionResult } from './useHudDescription'
import { useHudDescription } from './useHudDescription'
import type { UseHudShortcutsOptions } from './useHudShortcuts'
import { useHudShortcuts } from './useHudShortcuts'
import type { UseHudStateResult } from './useHudState'
import { useHudState } from './useHudState'
import type { UseHudTargetIssueResult } from './useHudTargetIssue'
import { useHudTargetIssue } from './useHudTargetIssue'
import type { TourTargetInfo } from './useTourTarget'

export interface UseTourHudOptions {
  overlayPadding?: number
  overlayRadius?: number
  /**
   * Disable automatic keyboard shortcut handling.
   * Enabled by default.
   */
  shortcuts?: boolean
  /**
   * Disable automatic body scroll locking when the HUD traps focus.
   * Enabled by default.
   */
  bodyScrollLock?: boolean
}

export interface TourHudOverlayConfig {
  padding?: number
  radius?: number
  interactionMode: BackdropInteractionMode
}

export interface TourHudPopoverConfig extends HudPopoverProps {
  placement?: Step<ReactNode>['placement']
}

export interface TourHudDescription extends UseHudDescriptionResult {
  /**
   * Convenience alias for `targetDescription`.
   */
  text: string | null
}

export interface TourHudFocusManagerState {
  active: boolean
  target: TourTargetInfo
  popoverNode: HTMLElement | null
  setPopoverNode: (node: HTMLElement | null) => void
}

export interface UseTourHudResult {
  hudState: UseHudStateResult
  disableDefaultHud: boolean
  overlay: TourHudOverlayConfig
  popover: TourHudPopoverConfig
  description: TourHudDescription
  focusManager: TourHudFocusManagerState
  targetIssue: UseHudTargetIssueResult
  shouldLockBodyScroll: boolean
  shortcutsEnabled: boolean
  tokens: UseHudAppearanceResult['tokens']
}

const DEFAULT_SHORTCUTS = true
const DEFAULT_BODY_SCROLL_LOCK = true

export const useTourHud = (
  options: UseTourHudOptions = {},
): UseTourHudResult => {
  const {
    overlayPadding,
    overlayRadius,
    shortcuts = DEFAULT_SHORTCUTS,
    bodyScrollLock = DEFAULT_BODY_SCROLL_LOCK,
  } = options

  const { backdropInteraction, lockBodyScroll } = useTour()
  const hudState = useHudState()
  const isRunning = Boolean(hudState.runningState)
  const disableDefaultHud = hudState.hudRenderMode === 'none'
  const [popoverNode, setPopoverNode] = useState<HTMLElement | null>(null)

  const appearance = useHudAppearance({
    overlayPadding,
    overlayRadius,
    flowHudOptions: hudState.flowHudOptions,
    defaultBackdropInteraction: backdropInteraction,
    defaultLockBodyScroll: lockBodyScroll,
    isActive: isRunning,
  })

  const description = useHudDescription({
    step: hudState.runningStep,
    fallbackAriaDescribedBy: appearance.popover.ariaDescribedBy,
  })

  const targetIssue = useHudTargetIssue(hudState.hudTarget)

  const shouldLockBodyScroll = Boolean(
    bodyScrollLock &&
      !disableDefaultHud &&
      appearance.lockBodyScroll &&
      hudState.focusTrapActive,
  )
  useBodyScrollLock(shouldLockBodyScroll)

  const shortcutsEnabled = Boolean(shortcuts && hudState.shouldRender)
  useHudShortcuts(shortcutsEnabled ? hudState.hudTarget : null, {
    enabled: shortcutsEnabled,
  } satisfies UseHudShortcutsOptions)

  const overlay: TourHudOverlayConfig = {
    padding: appearance.overlayPadding,
    radius: appearance.overlayRadius,
    interactionMode: appearance.backdropInteraction,
  }

  const popover: TourHudPopoverConfig = useMemo(() => {
    return {
      ...appearance.popover,
      placement: hudState.runningStep?.placement,
    }
  }, [appearance.popover, hudState.runningStep?.placement])

  const descriptionResult: TourHudDescription = useMemo(() => {
    return {
      ...description,
      text: description.targetDescription,
    }
  }, [description])

  const focusManager: TourHudFocusManagerState = useMemo(
    () => ({
      active: hudState.focusTrapActive,
      target: hudState.hudTarget,
      popoverNode,
      setPopoverNode,
    }),
    [hudState.focusTrapActive, hudState.hudTarget, popoverNode, setPopoverNode],
  )

  return {
    hudState,
    disableDefaultHud,
    overlay,
    popover,
    description: descriptionResult,
    focusManager,
    targetIssue,
    shouldLockBodyScroll,
    shortcutsEnabled,
    tokens: appearance.tokens,
  }
}
