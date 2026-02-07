import { describe, expect, it } from 'vitest'
import type { FlowDefinition, FlowState, Step } from '@flowsterix/core'
import { serializeEvent } from '../serializer'

const makeStep = (overrides: Partial<Step> = {}): Step => ({
  id: 'step-1',
  target: { selector: '#btn', getNode: () => null, description: 'A button' },
  content: 'Hello' as unknown,
  placement: 'bottom',
  mask: 'hole',
  controls: { back: 'hidden' },
  route: /^\/dashboard/,
  advance: [
    { type: 'manual', lockBack: true },
    { type: 'event', event: 'click', on: 'target' },
    { type: 'delay', ms: 3000 },
    { type: 'route', to: /^\/settings/ },
    { type: 'predicate', check: () => true, pollMs: 500 },
  ],
  waitFor: { selector: '#ready', predicate: () => true },
  onEnter: () => {},
  onExit: () => {},
  ...overrides,
})

const makeFlow = (overrides: Partial<FlowDefinition> = {}): FlowDefinition => ({
  id: 'tour-1',
  version: { major: 2, minor: 1 },
  steps: [makeStep()],
  metadata: { category: 'onboarding' },
  autoStart: true,
  resumeStrategy: 'chain',
  hud: { render: 'default' },
  migrate: () => null,
  ...overrides,
})

const makeState = (overrides: Partial<FlowState> = {}): FlowState => ({
  status: 'running',
  stepIndex: 0,
  version: '2.1',
  updatedAt: 1700000000000,
  ...overrides,
})

const baseParams = {
  sessionId: 'sess-123',
  projectId: 'proj-456',
}

describe('serializeEvent', () => {
  describe('flow serialization', () => {
    it('serializes flow metadata, strips hud and migrate', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowStart',
        payload: { flow: makeFlow(), state: makeState() },
      })

      expect(result.flow).toEqual({
        id: 'tour-1',
        version: { major: 2, minor: 1 },
        stepCount: 1,
        metadata: { category: 'onboarding' },
        autoStart: true,
        resumeStrategy: 'chain',
      })
      // hud and migrate should not be present
      expect(result.flow).not.toHaveProperty('hud')
      expect(result.flow).not.toHaveProperty('migrate')
      expect(result.flow).not.toHaveProperty('steps')
    })
  })

  describe('step serialization', () => {
    it('extracts selector from target object, strips getNode and description', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep(),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.target).toBe('#btn')
    })

    it('serializes screen target', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep({ target: 'screen' }),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.target).toBe('screen')
    })

    it('converts RegExp route to string', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep(),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.route).toBe('^\\/dashboard')
    })

    it('keeps string route as-is', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep({ route: '/settings' }),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.route).toBe('/settings')
    })

    it('serializes advance rules, strips check function', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep(),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.advance).toEqual([
        { type: 'manual', lockBack: true },
        { type: 'event', event: 'click', on: 'target' },
        { type: 'delay', ms: 3000 },
        { type: 'route', to: '^\\/settings' },
        { type: 'predicate' },
      ])
    })

    it('strips content, onEnter, onExit, waitFor from step', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep(),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step).not.toHaveProperty('content')
      expect(result.step).not.toHaveProperty('onEnter')
      expect(result.step).not.toHaveProperty('onExit')
      expect(result.step).not.toHaveProperty('waitFor')
    })

    it('preserves placement, mask, controls, dialogId', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep({ dialogId: 'dlg-1' }),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step!.placement).toBe('bottom')
      expect(result.step!.mask).toBe('hole')
      expect(result.step!.controls).toEqual({ back: 'hidden' })
      expect(result.step!.dialogId).toBe('dlg-1')
    })
  })

  describe('event-specific fields', () => {
    it('flowStart includes flow + state', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowStart',
        payload: { flow: makeFlow(), state: makeState() },
      })

      expect(result.type).toBe('flowStart')
      expect(result.state).toEqual(makeState())
      expect(result.step).toBeUndefined()
    })

    it('stepEnter includes step, direction, reason', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepEnter',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: makeStep(),
          currentStepIndex: 0,
          previousStep: null,
          previousStepIndex: -1,
          direction: 'forward',
          reason: 'start',
        },
      })

      expect(result.step).toBeDefined()
      expect(result.direction).toBe('forward')
      expect(result.reason).toBe('start')
    })

    it('stepExit includes previousStep', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'stepExit',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          currentStep: null,
          currentStepIndex: -1,
          previousStep: makeStep(),
          previousStepIndex: 0,
          direction: 'forward',
          reason: 'advance',
        },
      })

      expect(result.previousStep).toBeDefined()
      expect(result.previousStep!.id).toBe('step-1')
    })

    it('flowCancel includes reason', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowCancel',
        payload: {
          flow: makeFlow(),
          state: makeState({ status: 'cancelled' }),
          reason: 'skipped',
        },
      })

      expect(result.reason).toBe('skipped')
    })

    it('flowError serializes error with code and meta', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowError',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          code: 'storage.persist_failed',
          error: new Error('Write failed'),
          meta: { key: 'tour:flow-1' },
        },
      })

      expect(result.error).toEqual({
        code: 'storage.persist_failed',
        message: 'Write failed',
        name: 'Error',
        meta: { key: 'tour:flow-1' },
      })
    })

    it('flowError includes stack only when debug is true', () => {
      const err = new Error('fail')
      err.stack = 'Error: fail\n    at test.ts:1'

      const withoutDebug = serializeEvent({
        ...baseParams,
        event: 'flowError',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          code: 'storage.persist_failed',
          error: err,
        },
      })

      const withDebug = serializeEvent({
        ...baseParams,
        event: 'flowError',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          code: 'storage.persist_failed',
          error: err,
        },
        debug: true,
      })

      expect(withoutDebug.error!.stack).toBeUndefined()
      expect(withDebug.error!.stack).toBe('Error: fail\n    at test.ts:1')
    })

    it('flowError handles non-Error objects', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowError',
        payload: {
          flow: makeFlow(),
          state: makeState(),
          code: 'storage.persist_failed',
          error: 'raw string error',
        },
      })

      expect(result.error!.message).toBe('raw string error')
    })

    it('versionMismatch serializes version info', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'versionMismatch',
        payload: {
          flow: makeFlow(),
          flowId: 'tour-1',
          oldVersion: { major: 1, minor: 0 },
          newVersion: { major: 2, minor: 1 },
          action: 'migrated',
        },
      })

      expect(result.versionMismatch).toEqual({
        oldVersion: '1.0',
        newVersion: '2.1',
        action: 'migrated',
      })
    })
  })

  describe('metadata fields', () => {
    it('includes sessionId, projectId, timestamp', () => {
      const before = Date.now()
      const result = serializeEvent({
        ...baseParams,
        event: 'flowStart',
        payload: { flow: makeFlow(), state: makeState() },
      })
      const after = Date.now()

      expect(result.sessionId).toBe('sess-123')
      expect(result.projectId).toBe('proj-456')
      expect(result.timestamp).toBeGreaterThanOrEqual(before)
      expect(result.timestamp).toBeLessThanOrEqual(after)
    })

    it('includes user when provided', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowStart',
        payload: { flow: makeFlow(), state: makeState() },
        user: { id: 'user-1', traits: { plan: 'pro' } },
      })

      expect(result.user).toEqual({ id: 'user-1', traits: { plan: 'pro' } })
    })

    it('omits user when not provided', () => {
      const result = serializeEvent({
        ...baseParams,
        event: 'flowStart',
        payload: { flow: makeFlow(), state: makeState() },
      })

      expect(result.user).toBeUndefined()
    })
  })
})
