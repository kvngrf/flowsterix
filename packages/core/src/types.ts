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
  content: TContent
  advance?: Array<AdvanceRule<TContent>>
  waitFor?: StepWaitFor
  onResume?: StepHook<TContent>
  onExit?: StepHook<TContent>
  controls?: StepControls
}

export interface FlowHudOverlayOptions {
  padding?: number
  radius?: number
  blur?: number
  color?: string
  colorClassName?: string
  shadow?: string
  shadowClassName?: string
}

export interface FlowHudPopoverOptions {
  offset?: number
}

export interface FlowHudOptions {
  overlay?: FlowHudOverlayOptions
  popover?: FlowHudPopoverOptions
}

export interface FlowDefinition<TContent = unknown> {
  id: string
  version: number
  steps: Array<Step<TContent>>
  hud?: FlowHudOptions
  metadata?: Record<string, unknown>
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
