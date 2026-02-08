import { describe, expect, it } from 'vitest'
import { validateFlowDefinition } from '../validation'
import type { FlowDefinition } from '../types'

const minimalValidFlow: FlowDefinition<string> = {
  id: 'test-flow',
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: 'step-1',
      target: { selector: '#element' },
      content: 'Hello',
    },
  ],
}

describe('validateFlowDefinition', () => {
  describe('valid flows', () => {
    it('accepts minimal valid flow', () => {
      const result = validateFlowDefinition(minimalValidFlow)
      expect(result.id).toBe('test-flow')
    })

    it('accepts flow with screen target', () => {
      const flow: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [{ id: 'step-1', target: 'screen', content: 'Hello' }],
      }
      expect(() => validateFlowDefinition(flow)).not.toThrow()
    })

    it('accepts flow with getNode target', () => {
      const flow: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { getNode: () => null },
            content: 'Hello',
          },
        ],
      }
      expect(() => validateFlowDefinition(flow)).not.toThrow()
    })

    it('accepts flow with all optional fields', () => {
      const flow: FlowDefinition<string> = {
        id: 'full-flow',
        version: { major: 2, minor: 3 },
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el', description: 'The button' },
            route: '/dashboard',
            placement: 'bottom-start',
            mask: { padding: 8, radius: 4 },
            targetBehavior: {
              hidden: 'screen',
              hiddenDelayMs: 1000,
              scrollMargin: { top: 10, bottom: 10 },
              scrollMode: 'center',
              scrollDurationMs: 350,
            },
            content: 'Content',
            advance: [{ type: 'manual' }],
            waitFor: { selector: '#ready', timeout: 5000 },
            controls: { back: 'hidden', next: 'auto' },
            onEnter: () => {},
            onExit: () => {},
            onResume: () => {},
          },
        ],
        hud: {
          render: 'default',
          popover: { offset: 8 },
          backdrop: { interaction: 'block' },
          behavior: { lockBodyScroll: true },
        },
        resumeStrategy: 'chain',
        autoStart: true,
        metadata: { custom: 'value' },
        migrate: () => null,
      }
      expect(() => validateFlowDefinition(flow)).not.toThrow()
    })
  })

  describe('invalid flow id', () => {
    it('rejects empty flow id', () => {
      const flow = { ...minimalValidFlow, id: '' }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })
  })

  describe('invalid version', () => {
    it('rejects negative major version', () => {
      const flow = {
        ...minimalValidFlow,
        version: { major: -1, minor: 0 },
      }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })

    it('rejects non-integer minor version', () => {
      const flow = {
        ...minimalValidFlow,
        version: { major: 1, minor: 0.5 },
      }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })
  })

  describe('invalid steps', () => {
    it('rejects empty steps array', () => {
      const flow = { ...minimalValidFlow, steps: [] }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })

    it('rejects step with empty id', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [{ id: '', target: { selector: '#el' }, content: 'Hi' }],
      }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })

    it('rejects target without selector or getNode', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [{ id: 'step-1', target: {}, content: 'Hi' }],
      }
      expect(() => validateFlowDefinition(flow)).toThrow()
    })
  })

  describe('invalid advance rules', () => {
    it('rejects advance rule with invalid type', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            advance: [{ type: 'invalid' }],
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })

    it('rejects predicate advance without function', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            advance: [{ type: 'predicate', check: 'not a function' }],
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })

    it('accepts valid predicate advance', () => {
      const flow: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            advance: [{ type: 'predicate', check: () => true }],
          },
        ],
      }
      expect(() => validateFlowDefinition(flow)).not.toThrow()
    })

    it('rejects delay advance with negative ms', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            advance: [{ type: 'delay', ms: -100 }],
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })
  })

  describe('invalid mask', () => {
    it('rejects mask with negative padding', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            mask: { padding: -5 },
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })

    it('accepts valid mask literals', () => {
      const flowHole: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [
          { id: 'step-1', target: { selector: '#el' }, content: 'Hi', mask: 'hole' },
        ],
      }
      const flowNone: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [
          { id: 'step-1', target: { selector: '#el' }, content: 'Hi', mask: 'none' },
        ],
      }
      expect(() => validateFlowDefinition(flowHole)).not.toThrow()
      expect(() => validateFlowDefinition(flowNone)).not.toThrow()
    })
  })

  describe('invalid controls', () => {
    it('rejects invalid control state', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            controls: { back: 'invalid' },
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })
  })

  describe('invalid waitFor', () => {
    it('rejects waitFor with non-function predicate', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            waitFor: { predicate: 'not a function' },
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })
  })

  describe('placements', () => {
    const placements = [
      'auto', 'top', 'bottom', 'left', 'right',
      'auto-start', 'auto-end', 'top-start', 'top-end',
      'bottom-start', 'bottom-end', 'left-start', 'left-end',
      'right-start', 'right-end',
    ] as const

    it.each(placements)('accepts placement: %s', (placement) => {
      const flow: FlowDefinition<string> = {
        ...minimalValidFlow,
        steps: [
          { id: 'step-1', target: { selector: '#el' }, content: 'Hi', placement },
        ],
      }
      expect(() => validateFlowDefinition(flow)).not.toThrow()
    })

    it('rejects invalid placement', () => {
      const flow = {
        ...minimalValidFlow,
        steps: [
          {
            id: 'step-1',
            target: { selector: '#el' },
            content: 'Hi',
            placement: 'invalid',
          },
        ],
      }
      expect(() => validateFlowDefinition(flow as unknown as FlowDefinition<string>)).toThrow()
    })
  })
})
