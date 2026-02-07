import type {
  AdvanceRule,
  FlowDefinition,
  FlowEvents,
  FlowState,
  Step,
} from '@flowsterix/core'
import type {
  SerializedAdvanceRule,
  SerializedError,
  SerializedFlow,
  SerializedStep,
  StudioEvent,
  UserContext,
} from './types'

interface SerializeEventParams {
  event: string
  payload: FlowEvents[keyof FlowEvents]
  sessionId: string
  projectId: string
  user?: UserContext
  debug?: boolean
}

const serializeAdvanceRule = (rule: AdvanceRule): SerializedAdvanceRule => {
  const serialized: SerializedAdvanceRule = { type: rule.type }
  if (rule.lockBack != null) serialized.lockBack = rule.lockBack

  if (rule.type === 'delay') {
    serialized.ms = rule.ms
  } else if (rule.type === 'event') {
    serialized.event = rule.event
    if (rule.on != null) serialized.on = rule.on
  } else if (rule.type === 'route') {
    if (rule.to != null) {
      serialized.to = rule.to instanceof RegExp ? rule.to.source : rule.to
    }
  }

  return serialized
}

const serializeStep = (step: Step): SerializedStep => {
  let target: string
  if (step.target === 'screen') {
    target = 'screen'
  } else if (typeof step.target === 'object' && step.target.selector) {
    target = step.target.selector
  } else {
    target = 'unknown'
  }

  const serialized: SerializedStep = {
    id: step.id,
    target,
  }

  if (step.placement != null) serialized.placement = step.placement
  if (step.mask != null) serialized.mask = step.mask
  if (step.controls != null) serialized.controls = step.controls
  if (step.dialogId != null) serialized.dialogId = step.dialogId

  if (step.route != null) {
    serialized.route =
      step.route instanceof RegExp ? step.route.source : step.route
  }

  if (step.advance != null) {
    serialized.advance = step.advance.map(serializeAdvanceRule)
  }

  return serialized
}

const serializeFlow = (flow: FlowDefinition): SerializedFlow => {
  const serialized: SerializedFlow = {
    id: flow.id,
    version: flow.version,
    stepCount: flow.steps.length,
  }

  if (flow.metadata != null) serialized.metadata = flow.metadata
  if (flow.autoStart != null) serialized.autoStart = flow.autoStart
  if (flow.resumeStrategy != null) serialized.resumeStrategy = flow.resumeStrategy

  return serialized
}

const serializeError = (params: {
  error?: unknown
  code: string
  meta?: Record<string, unknown>
  debug?: boolean
}): SerializedError => {
  const serialized: SerializedError = { code: params.code }

  if (params.meta != null) serialized.meta = params.meta

  if (params.error instanceof Error) {
    serialized.message = params.error.message
    serialized.name = params.error.name
    if (params.debug) serialized.stack = params.error.stack
  } else if (params.error != null) {
    serialized.message = String(params.error)
  }

  return serialized
}

export const serializeEvent = (params: SerializeEventParams): StudioEvent => {
  const { event, payload, sessionId, projectId, user, debug } = params

  // Use Record for flexible property access; all analytics payloads include flow + state
  const p = payload as Record<string, unknown>
  const base: StudioEvent = {
    type: event,
    timestamp: Date.now(),
    sessionId,
    projectId,
    flow: serializeFlow(p.flow as FlowDefinition),
    state: p.state as FlowState,
  }

  if (user != null) base.user = user

  // Event-specific fields
  if (p.currentStep != null) {
    base.step = serializeStep(p.currentStep as Step)
  }
  if (p.previousStep != null) {
    base.previousStep = serializeStep(p.previousStep as Step)
  }
  if (p.reason != null) {
    base.reason = String(p.reason)
  }
  if (p.direction != null) {
    base.direction = String(p.direction)
  }

  // flowError
  if (event === 'flowError') {
    base.error = serializeError({
      error: p.error,
      code: p.code as string,
      meta: p.meta as Record<string, unknown> | undefined,
      debug,
    })
  }

  // versionMismatch
  if (event === 'versionMismatch') {
    const oldV = p.oldVersion as { major: number; minor: number }
    const newV = p.newVersion as { major: number; minor: number }
    base.versionMismatch = {
      oldVersion: `${oldV.major}.${oldV.minor}`,
      newVersion: `${newV.major}.${newV.minor}`,
      action: p.action as string,
    }
  }

  return base
}
