import type { BackdropInteractionMode, Step } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { useTour } from '../context'
import { useBodyScrollLock } from './useBodyScrollLock'
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
  shortcuts?: boolean | UseHudShortcutsOptions
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

export interface TourHudPopoverConfig {
  offset: number
  role: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaModal: boolean
  width?: number | string
  maxWidth?: number | string
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
}

const DEFAULT_SHORTCUTS = true
const DEFAULT_BODY_SCROLL_LOCK = true

export const useTourHud = (
  options: UseTourHudOptions = {},
): UseTourHudResult => {
  const {
    overlayPadding,
    overlayRadius,
    bodyScrollLock = DEFAULT_BODY_SCROLL_LOCK,
  } = options
  const shortcuts = options.shortcuts ?? DEFAULT_SHORTCUTS

  const { backdropInteraction, lockBodyScroll } = useTour()
  const hudState = useHudState()
  const disableDefaultHud = hudState.hudRenderMode === 'none'
  const [popoverNode, setPopoverNode] = useState<HTMLElement | null>(null)

  const popoverOptions = hudState.flowHudOptions?.popover

  const description = useHudDescription({
    step: hudState.runningStep,
    fallbackAriaDescribedBy: popoverOptions?.ariaDescribedBy,
  })

  const targetIssue = useHudTargetIssue(hudState.hudTarget)

  const shouldLockBodyScroll = Boolean(
    bodyScrollLock &&
      (hudState.flowHudOptions?.behavior?.lockBodyScroll ?? lockBodyScroll) &&
      hudState.focusTrapActive,
  )
  useBodyScrollLock(shouldLockBodyScroll)

  const shortcutOptions: UseHudShortcutsOptions =
    typeof shortcuts === 'object' ? shortcuts : {}
  const shortcutsEnabled = Boolean(
    (typeof shortcuts === 'boolean' ? shortcuts : shortcuts.enabled ?? true) &&
      hudState.shouldRender,
  )
  useHudShortcuts(shortcutsEnabled ? hudState.hudTarget : null, {
    ...shortcutOptions,
    enabled: shortcutsEnabled,
  } satisfies UseHudShortcutsOptions)

  const overlay: TourHudOverlayConfig = {
    padding: overlayPadding,
    radius: overlayRadius,
    interactionMode:
      hudState.flowHudOptions?.backdrop?.interaction ?? backdropInteraction,
  }

  const popover: TourHudPopoverConfig = useMemo(() => {
    return {
      offset: popoverOptions?.offset ?? 16,
      role: popoverOptions?.role ?? 'dialog',
      ariaLabel: popoverOptions?.ariaLabel,
      ariaDescribedBy: popoverOptions?.ariaDescribedBy,
      ariaModal: popoverOptions?.ariaModal ?? false,
      width: popoverOptions?.width,
      maxWidth: popoverOptions?.maxWidth,
      placement: hudState.runningStep?.placement,
    }
  }, [hudState.runningStep?.placement, popoverOptions])

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
  }
}
