import type {
  DialogAutoOpen,
  DialogConfig,
  EventBus,
  FlowDefinition,
  FlowEvents,
  FlowState,
} from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import type { DialogRegistryContextValue } from '../dialog/DialogRegistryContext'

export interface UseDialogAutomationParams {
  flow: FlowDefinition<ReactNode> | undefined
  state: FlowState | null
  events: EventBus<FlowEvents<ReactNode>> | null
  registry: DialogRegistryContextValue | undefined
  onDialogNotMounted?: (dialogId: string, stepId: string) => void
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

/**
 * Internal hook for TourProvider that handles dialog auto-open/close
 * based on step transitions. Works in conjunction with useTourDialog.
 */
export const useDialogAutomation = (params: UseDialogAutomationParams): void => {
  const { flow, state, events, registry, onDialogNotMounted } = params
  const previousDialogIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!events || !flow || !registry) return

    const unsubscribeEnter = events.on('stepEnter', (payload) => {
      const step = payload.currentStep
      const dialogId = step.dialogId
      const previousDialogId = previousDialogIdRef.current

      // Close previous dialog if different
      if (
        previousDialogId &&
        previousDialogId !== dialogId &&
        flow.dialogs?.[previousDialogId]
      ) {
        const config = flow.dialogs[previousDialogId]
        const autoClose = config.autoClose ?? 'differentDialog'
        if (autoClose === 'always' || autoClose === 'differentDialog') {
          const controller = registry.getController(previousDialogId)
          if (controller) {
            requestAnimationFrame(() => {
              controller.close()
            })
          }
        }
      }

      // Open new dialog if step has one
      if (dialogId && flow.dialogs?.[dialogId]) {
        const config = flow.dialogs[dialogId]
        const autoOpenConfig = resolveAutoOpen(config)
        const isResume = payload.reason === 'resume'
        const shouldAutoOpen = isResume
          ? autoOpenConfig.onResume
          : autoOpenConfig.onEnter

        if (shouldAutoOpen) {
          const controller = registry.getController(dialogId)
          if (controller) {
            requestAnimationFrame(() => {
              controller.open()
            })
          } else if (onDialogNotMounted) {
            // Warn in dev that dialog isn't mounted
            onDialogNotMounted(dialogId, step.id)
          }
        }
      }

      previousDialogIdRef.current = dialogId
    })

    const unsubscribeExit = events.on('stepExit', (payload) => {
      const step = payload.previousStep
      const dialogId = step.dialogId
      const nextStep = payload.currentStep

      // Don't close if next step uses same dialog
      if (nextStep?.dialogId === dialogId) return

      if (dialogId && flow.dialogs?.[dialogId]) {
        const config = flow.dialogs[dialogId]
        const autoClose = config.autoClose ?? 'differentDialog'

        // 'never' means manual close only
        if (autoClose === 'never') return

        const controller = registry.getController(dialogId)
        if (controller) {
          requestAnimationFrame(() => {
            controller.close()
          })
        }
      }
    })

    // Handle flow pause/cancel/complete - close any active dialog
    const handleFlowEnd = () => {
      const dialogId = previousDialogIdRef.current
      if (dialogId && flow.dialogs?.[dialogId]) {
        const config = flow.dialogs[dialogId]
        const autoClose = config.autoClose ?? 'differentDialog'
        if (autoClose !== 'never') {
          const controller = registry.getController(dialogId)
          controller?.close()
        }
      }
      previousDialogIdRef.current = undefined
    }

    const unsubscribePause = events.on('flowPause', handleFlowEnd)
    const unsubscribeCancel = events.on('flowCancel', handleFlowEnd)
    const unsubscribeComplete = events.on('flowComplete', handleFlowEnd)

    return () => {
      unsubscribeEnter()
      unsubscribeExit()
      unsubscribePause()
      unsubscribeCancel()
      unsubscribeComplete()
    }
  }, [events, flow, registry, onDialogNotMounted])

  // Initialize previousDialogIdRef on flow start/resume
  useEffect(() => {
    if (!flow || !state || state.status !== 'running') return
    if (state.stepIndex < 0 || state.stepIndex >= flow.steps.length) return

    const currentStep = flow.steps[state.stepIndex]
    previousDialogIdRef.current = currentStep.dialogId
  }, [flow, state])
}
