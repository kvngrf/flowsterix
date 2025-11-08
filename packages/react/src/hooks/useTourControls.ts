import { useCallback, useMemo } from 'react'

import type { AdvanceRule } from '@tour/core'

import type { TourContextValue } from '../context'
import { useTour } from '../context'

export interface TourControlsState {
  showBackButton: boolean
  backDisabled: boolean
  canGoBack: boolean
  showNextButton: boolean
  nextDisabled: boolean
  canGoNext: boolean
  isFirst: boolean
  isLast: boolean
  isActive: boolean
  goBack: () => void
  goNext: () => void
  cancel: TourContextValue['cancel']
}
type Rule = AdvanceRule<unknown>

const hasManualAdvance = (rules: Array<Rule>) =>
  rules.some((rule) => rule.type === 'manual')

const didPreviousAdvanceViaRoute = (rules: Array<Rule>) =>
  rules.some((rule) => rule.type === 'route')

const didPreviousAdvanceViaTargetEvent = (rules: Array<Rule>) =>
  rules.some((rule) => rule.type === 'event' && rule.on === 'target')

export const useTourControls = (): TourControlsState => {
  const tour = useTour()
  const {
    back,
    next,
    cancel,
    complete,
    state,
    activeFlowId,
    flows,
    activeStep,
  } = tour

  const computed = useMemo(() => {
    if (!state || state.status !== 'running' || !activeStep) {
      return {
        isActive: false,
        isFirst: true,
        isLast: true,
        showBackButton: false,
        backDisabled: true,
        showNextButton: false,
        nextDisabled: true,
      }
    }

    const definition = activeFlowId ? flows.get(activeFlowId) : null
    const totalSteps = definition?.steps.length ?? 0
    const stepIndex = state.stepIndex
    const isFirst = stepIndex <= 0
    const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1

    const previousStep =
      !definition || stepIndex <= 0 ? null : definition.steps[stepIndex - 1]

    const advanceRules = (activeStep.advance ?? []) as Array<Rule>
    const hasAdvanceRules = advanceRules.length > 0
    const previousAdvanceRules = (previousStep?.advance ?? []) as Array<Rule>

    const backControlState = activeStep.controls?.back ?? 'auto'
    const nextControlState = activeStep.controls?.next ?? 'auto'

    const showBackButton =
      backControlState !== 'hidden' &&
      !isFirst &&
      !didPreviousAdvanceViaRoute(previousAdvanceRules) &&
      !didPreviousAdvanceViaTargetEvent(previousAdvanceRules)

    const backDisabled = backControlState === 'disabled'

    const manualAdvancePresent = hasManualAdvance(advanceRules)

    const showNextButton =
      nextControlState !== 'hidden' &&
      (isLast || !hasAdvanceRules || manualAdvancePresent)

    const nextDisabled = nextControlState === 'disabled'

    return {
      isActive: true,
      isFirst,
      isLast,
      showBackButton,
      backDisabled,
      showNextButton,
      nextDisabled,
    }
  }, [activeFlowId, activeStep, flows, state])

  const {
    isActive,
    isFirst,
    isLast,
    showBackButton,
    backDisabled,
    showNextButton,
    nextDisabled,
  } = computed

  const canGoBack = showBackButton && !backDisabled
  const canGoNext = showNextButton && !nextDisabled

  const goBack = useCallback(() => {
    if (!canGoBack) return
    back()
  }, [back, canGoBack])

  const goNext = useCallback(() => {
    if (!canGoNext) return
    if (isLast) {
      complete()
    } else {
      next()
    }
  }, [canGoNext, complete, isLast, next])

  return useMemo(
    () => ({
      showBackButton,
      backDisabled,
      canGoBack,
      showNextButton,
      nextDisabled,
      canGoNext,
      isFirst,
      isLast,
      isActive,
      goBack,
      goNext,
      cancel,
    }),
    [
      backDisabled,
      canGoBack,
      canGoNext,
      cancel,
      goBack,
      goNext,
      isFirst,
      isLast,
      isActive,
      nextDisabled,
      showBackButton,
      showNextButton,
    ],
  )
}
