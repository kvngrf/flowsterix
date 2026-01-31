import type { DialogAutoOpen, DialogConfig } from '@flowsterix/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTour } from '../context'
import type { DialogController } from '../dialog/DialogRegistryContext'
import { useDialogRegistryOptional } from '../dialog/DialogRegistryContext'
import { useTourFocusDominance } from './useTourFocusDominance'

export interface UseRadixTourDialogParams {
  dialogId: string
}

export interface UseRadixTourDialogResult {
  /** True when current step has this dialogId */
  isStepActive: boolean
  /** Computed open state based on step + autoOpen rules */
  shouldBeOpen: boolean
  /** Call when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Props for Radix Dialog root */
  dialogProps: {
    open: boolean
    onOpenChange: (open: boolean) => void
    modal: boolean
  }
  /** Props for Radix DialogContent */
  contentProps: {
    trapFocus: boolean
    onInteractOutside: (e: Event) => void
    onFocusOutside: (e: Event) => void
    onEscapeKeyDown: (e: Event) => void
  }
}

const resolveAutoOpen = (
  config: DialogConfig | undefined,
): Required<DialogAutoOpen> => {
  if (!config) return { onEnter: true, onResume: true }
  const { autoOpen } = config
  if (autoOpen === false) return { onEnter: false, onResume: false }
  if (autoOpen === true || autoOpen === undefined) {
    return { onEnter: true, onResume: true }
  }
  return {
    onEnter: autoOpen.onEnter ?? true,
    onResume: autoOpen.onResume ?? true,
  }
}

export const useRadixTourDialog = (
  params: UseRadixTourDialogParams,
): UseRadixTourDialogResult => {
  const { dialogId } = params
  const { activeFlowId, state, flows, goToStep, events } = useTour()
  const registry = useDialogRegistryOptional()
  const { suspendExternalFocusTrap } = useTourFocusDominance()

  const [internalOpen, setInternalOpen] = useState(false)
  const lastStepIndexRef = useRef<number>(-1)
  const isResumeRef = useRef(false)

  const flow = activeFlowId ? flows.get(activeFlowId) : undefined
  const dialogConfig = flow?.dialogs?.[dialogId]
  const currentStep =
    flow && state && state.stepIndex >= 0
      ? flow.steps[state.stepIndex]
      : undefined

  const isStepActive = currentStep?.dialogId === dialogId
  const autoOpenConfig = resolveAutoOpen(dialogConfig)
  const autoClose = dialogConfig?.autoClose ?? 'differentDialog'

  // Compute whether dialog should be open based on tour state
  const shouldBeOpen = useMemo(() => {
    if (!isStepActive) return false
    // When step is active, we want it open (subject to autoOpen rules)
    return true
  }, [isStepActive])

  // Track resume events
  useEffect(() => {
    if (!events) return
    const unsubscribe = events.on('flowResume', () => {
      isResumeRef.current = true
    })
    return unsubscribe
  }, [events])

  // Handle auto-open/close based on step transitions
  useEffect(() => {
    if (!state || state.status !== 'running') return
    if (!flow) return

    const currentStepIndex = state.stepIndex
    const previousStepIndex = lastStepIndexRef.current
    const wasResume = isResumeRef.current
    isResumeRef.current = false

    // Skip on initial mount with no real transition
    if (previousStepIndex === -1 && currentStepIndex >= 0) {
      lastStepIndexRef.current = currentStepIndex
      // Initial entry - check if we should open
      if (isStepActive) {
        const shouldAutoOpen = wasResume
          ? autoOpenConfig.onResume
          : autoOpenConfig.onEnter
        if (shouldAutoOpen) {
          setInternalOpen(true)
        }
      }
      return
    }

    // No step change
    if (previousStepIndex === currentStepIndex) return

    lastStepIndexRef.current = currentStepIndex

    const previousStep =
      previousStepIndex >= 0 ? flow.steps[previousStepIndex] : undefined
    const wasActive = previousStep?.dialogId === dialogId

    // Entering a step with this dialogId
    if (isStepActive && !wasActive) {
      const shouldAutoOpen = wasResume
        ? autoOpenConfig.onResume
        : autoOpenConfig.onEnter
      if (shouldAutoOpen) {
        setInternalOpen(true)
      }
    }

    // Leaving a step with this dialogId
    if (wasActive && !isStepActive) {
      if (autoClose === 'always' || autoClose === 'differentDialog') {
        setInternalOpen(false)
      }
    }

    // Moving between steps with same dialogId - keep dialog open
    // (no action needed, dialog stays in current state)
  }, [
    state,
    flow,
    dialogId,
    isStepActive,
    autoOpenConfig.onEnter,
    autoOpenConfig.onResume,
    autoClose,
  ])

  // Handle step enter events for more precise control
  useEffect(() => {
    if (!events) return

    const unsubscribeEnter = events.on('stepEnter', (payload) => {
      const step = payload.currentStep
      if (step.dialogId !== dialogId) return

      const isResume = payload.reason === 'resume'
      const shouldAutoOpen = isResume
        ? autoOpenConfig.onResume
        : autoOpenConfig.onEnter

      if (shouldAutoOpen) {
        // Use rAF to debounce rapid transitions
        requestAnimationFrame(() => {
          setInternalOpen(true)
        })
      }
    })

    const unsubscribeExit = events.on('stepExit', (payload) => {
      const step = payload.previousStep
      if (step.dialogId !== dialogId) return

      // Check if next step has same dialogId
      const nextStep = payload.currentStep
      if (nextStep?.dialogId === dialogId) {
        // Same dialog, don't close
        return
      }

      if (autoClose === 'always' || autoClose === 'differentDialog') {
        requestAnimationFrame(() => {
          setInternalOpen(false)
        })
      }
    })

    return () => {
      unsubscribeEnter()
      unsubscribeExit()
    }
  }, [events, dialogId, autoOpenConfig, autoClose])

  // Handle user-initiated dismiss
  const handleDismiss = useCallback(() => {
    if (!dialogConfig) return
    setInternalOpen(false)
    goToStep(dialogConfig.onDismissGoToStepId)
  }, [dialogConfig, goToStep])

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setInternalOpen(true)
      } else {
        // User is trying to close - check if tour step is active
        if (isStepActive && dialogConfig) {
          handleDismiss()
        } else {
          setInternalOpen(false)
        }
      }
    },
    [isStepActive, dialogConfig, handleDismiss],
  )

  // Register controller with registry
  useEffect(() => {
    if (!registry) return

    const controller: DialogController = {
      open: () => setInternalOpen(true),
      close: () => setInternalOpen(false),
      isOpen: () => internalOpen,
    }

    registry.register(dialogId, controller)
    return () => registry.unregister(dialogId)
  }, [registry, dialogId, internalOpen])

  // Content props for Radix Dialog
  const preventDismiss = useCallback(
    (event: Event) => {
      if (suspendExternalFocusTrap) {
        event.preventDefault()
      }
    },
    [suspendExternalFocusTrap],
  )

  const handleEscapeKeyDown = useCallback(
    (event: Event) => {
      // When tour is active and step uses this dialog, handle dismiss behavior
      if (isStepActive && dialogConfig) {
        event.preventDefault()
        handleDismiss()
      }
    },
    [isStepActive, dialogConfig, handleDismiss],
  )

  const handleInteractOutside = useCallback(
    (event: Event) => {
      // Prevent backdrop click from closing during tour
      if (suspendExternalFocusTrap) {
        event.preventDefault()
        return
      }
      // When tour step is active, treat backdrop click as dismiss
      if (isStepActive && dialogConfig) {
        event.preventDefault()
        handleDismiss()
      }
    },
    [suspendExternalFocusTrap, isStepActive, dialogConfig, handleDismiss],
  )

  return {
    isStepActive,
    shouldBeOpen,
    onOpenChange,
    dialogProps: {
      open: internalOpen,
      onOpenChange,
      modal: !suspendExternalFocusTrap,
    },
    contentProps: {
      trapFocus: !suspendExternalFocusTrap,
      onInteractOutside: handleInteractOutside,
      onFocusOutside: preventDismiss,
      onEscapeKeyDown: handleEscapeKeyDown,
    },
  }
}
