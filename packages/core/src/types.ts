import type { EventBus } from './events'

export type FlowStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'

export interface FlowState {
  status: FlowStatus
  stepIndex: number
  version: number
  updatedAt: number
}

export type StepDirection = 'forward' | 'backward' | 'none'

export type StepEnterReason = 'start' | 'resume' | 'advance' | 'back' | 'jump'

export type StepExitReason =
  | 'advance'
  | 'back'
  | 'pause'
  | 'cancel'
  | 'complete'
  | 'unknown'

export type StepCompleteReason = 'advance' | 'flowComplete'

export interface StepTransitionPayload<TContent = unknown> {
  flow: FlowDefinition<TContent>
  state: FlowState
  currentStep: Step<TContent> | null
  currentStepIndex: number
  previousStep: Step<TContent> | null
  previousStepIndex: number
  direction: StepDirection
}

export interface StepEnterEvent<TContent = unknown>
  extends StepTransitionPayload<TContent> {
  currentStep: Step<TContent>
  reason: StepEnterReason
}

export interface StepExitEvent<TContent = unknown>
  extends StepTransitionPayload<TContent> {
  previousStep: Step<TContent>
  reason: StepExitReason
}

export interface StepCompleteEvent<TContent = unknown>
  extends StepTransitionPayload<TContent> {
  previousStep: Step<TContent>
  reason: StepCompleteReason
}

export type StepPlacement =
  | 'auto'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'auto-start'
  | 'auto-end'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end'

export type StepMask = 'hole' | 'none' | { padding?: number; radius?: number }

export type HiddenTargetFallbackMode = 'screen' | 'skip'

export type ScrollMarginConfig =
  | number
  | {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }

export interface StepTargetBehavior {
  hidden?: HiddenTargetFallbackMode
  hiddenDelayMs?: number
  scrollMargin?: ScrollMarginConfig
}

export type StepTarget =
  | 'screen'
  | {
      selector?: string
      getNode?: () => Element | null
      description?: string
    }

export type StepControlState = 'auto' | 'hidden' | 'disabled'

export interface StepControls {
  back?: StepControlState
  next?: StepControlState
}

export interface StepWaitFor {
  selector?: string
  timeout?: number
}

export interface AdvancePredicateContext<TContent = unknown> {
  flow: FlowDefinition<TContent>
  state: FlowState
  step: Step<TContent>
}

interface AdvanceRuleBase {
  lockBack?: boolean
}

export type AdvanceRule<TContent = unknown> =
  | ({ type: 'manual' } & AdvanceRuleBase)
  | ({ type: 'event'; event: string; on?: 'target' | string } & AdvanceRuleBase)
  | ({
      type: 'predicate'
      check: (ctx: AdvancePredicateContext<TContent>) => boolean
      pollMs?: number
      timeoutMs?: number
    } & AdvanceRuleBase)
  | ({ type: 'delay'; ms: number } & AdvanceRuleBase)
  | ({ type: 'route'; to?: string | RegExp } & AdvanceRuleBase)

export interface StepHookContext<TContent = unknown> {
  flow: FlowDefinition<TContent>
  state: FlowState
  step: Step<TContent>
}

export type StepHook<TContent = unknown> = (
  ctx: StepHookContext<TContent>,
) => void | Promise<void>

export interface Step<TContent = unknown> {
  id: string
  target: StepTarget
  route?: string | RegExp
  placement?: StepPlacement
  mask?: StepMask
  targetBehavior?: StepTargetBehavior
  content: TContent
  advance?: Array<AdvanceRule<TContent>>
  waitFor?: StepWaitFor
  onResume?: StepHook<TContent>
  onExit?: StepHook<TContent>
  controls?: StepControls
}

export interface FlowHudPopoverOptions {
  offset?: number
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaModal?: boolean
}

export interface FlowHudTokenOverrides {
  [key: string]: unknown
}

export interface FlowHudOptions {
  popover?: FlowHudPopoverOptions
  tokens?: FlowHudTokenOverrides
}

export interface FlowDefinition<TContent = unknown> {
  id: string
  version: number
  steps: Array<Step<TContent>>
  hud?: FlowHudOptions
  metadata?: Record<string, unknown>
}

export type FlowErrorCode =
  | 'async.schedule_failed'
  | 'storage.persist_failed'
  | 'storage.remove_failed'
  | 'storage.hydrate_failed'
  | 'flow.step_not_found'
  | 'flow.store_destroyed'

export interface FlowErrorEvent<TContent = unknown> {
  flow: FlowDefinition<TContent>
  state: FlowState
  code: FlowErrorCode
  error?: unknown
  meta?: Record<string, unknown>
}

export interface FlowEvents<TContent = unknown>
  extends Record<string, unknown> {
  flowStart: { flow: FlowDefinition<TContent>; state: FlowState }
  flowResume: { flow: FlowDefinition<TContent>; state: FlowState }
  flowPause: { flow: FlowDefinition<TContent>; state: FlowState }
  flowCancel: {
    flow: FlowDefinition<TContent>
    state: FlowState
    reason?: string
  }
  flowComplete: { flow: FlowDefinition<TContent>; state: FlowState }
  stepChange: {
    flow: FlowDefinition<TContent>
    state: FlowState
    step: Step<TContent> | null
    previousStep: Step<TContent> | null
  }
  stateChange: { flow: FlowDefinition<TContent>; state: FlowState }
  stepEnter: StepEnterEvent<TContent>
  stepExit: StepExitEvent<TContent>
  stepComplete: StepCompleteEvent<TContent>
  flowError: FlowErrorEvent<TContent>
}

type AnalyticsHandlerName<TName extends string> = `on${Capitalize<TName>}`

export type FlowAnalyticsHandlers<TContent = unknown> = {
  [TKey in Extract<
    keyof FlowEvents<TContent>,
    string
  > as AnalyticsHandlerName<TKey>]?: (
    payload: FlowEvents<TContent>[TKey],
  ) => void
}

export interface StartFlowOptions {
  fromStepId?: string
  fromStepIndex?: number
  resume?: boolean
}

export interface FlowStore<TContent = unknown> {
  readonly definition: FlowDefinition<TContent>
  readonly events: EventBus<FlowEvents<TContent>>
  getState: () => FlowState
  start: (options?: StartFlowOptions) => FlowState
  next: () => FlowState
  back: () => FlowState
  goToStep: (step: number | string) => FlowState
  pause: () => FlowState
  resume: () => FlowState
  cancel: (reason?: string) => FlowState
  complete: () => FlowState
  subscribe: (listener: (state: FlowState) => void) => () => void
  destroy: () => void
}
