import { z } from 'zod'
import type { FlowDefinition } from './types'

const targetSchema = z
  .union([
    z.literal('screen'),
    z
      .object({
        selector: z.string().optional(),
        getNode: z
          .custom<() => Element | null>(
            (value) => typeof value === 'function',
            {
              message: 'getNode must be a function returning an Element',
            },
          )
          .optional(),
        description: z.string().optional(),
      })
      .refine((value) => Boolean(value.selector || value.getNode), {
        message: 'target requires either a selector or getNode definition',
      }),
  ])
  .describe('Step target definition')

const maskSchema = z.union([
  z.literal('hole'),
  z.literal('none'),
  z.object({
    padding: z.number().nonnegative().optional(),
    radius: z.number().nonnegative().optional(),
  }),
])

const controlStateSchema = z.union([
  z.literal('auto'),
  z.literal('hidden'),
  z.literal('disabled'),
])

const advanceRuleSchema = z.union([
  z.object({ type: z.literal('manual') }),
  z.object({
    type: z.literal('event'),
    event: z.string(),
    on: z.union([z.literal('target'), z.string()]).optional(),
  }),
  z.object({
    type: z.literal('predicate'),
    pollMs: z.number().positive().optional(),
    timeoutMs: z.number().positive().optional(),
    check: z.custom<(ctx: unknown) => boolean | Promise<boolean>>(
      (value) => typeof value === 'function',
      {
        message: 'predicate check must be a function',
      },
    ),
  }),
  z.object({ type: z.literal('delay'), ms: z.number().nonnegative() }),
  z.object({
    type: z.literal('route'),
    to: z.union([z.string(), z.instanceof(RegExp)]).optional(),
  }),
])

const waitForSchema = z
  .object({
    selector: z.string().optional(),
    timeout: z.number().positive().optional(),
    predicate: z
      .custom<(ctx: unknown) => boolean | Promise<boolean>>(
        (value) => typeof value === 'function',
        {
          message: 'waitFor.predicate must be a function',
        },
      )
      .optional(),
    pollMs: z.number().positive().optional(),
    subscribe: z
      .custom<(ctx: unknown) => unknown>(
        (value) => typeof value === 'function',
        {
          message: 'waitFor.subscribe must be a function',
        },
      )
      .optional(),
  })
  .partial()

const scrollMarginSchema = z.union([
  z.number().nonnegative(),
  z
    .object({
      top: z.number().nonnegative().optional(),
      bottom: z.number().nonnegative().optional(),
      left: z.number().nonnegative().optional(),
      right: z.number().nonnegative().optional(),
    })
    .strict(),
])

const hudPopoverSchema = z.object({
  offset: z.number().optional(),
  role: z.string().optional(),
  ariaLabel: z.string().optional(),
  ariaDescribedBy: z.string().optional(),
  ariaModal: z.boolean().optional(),
})

const hudBackdropSchema = z.object({
  interaction: z
    .union([z.literal('block'), z.literal('passthrough')])
    .optional(),
})

const hudBehaviorSchema = z.object({
  lockBodyScroll: z.boolean().optional(),
})

const hudSchema = z.object({
  render: z.union([z.literal('default'), z.literal('none')]).optional(),
  popover: hudPopoverSchema.optional(),
  backdrop: hudBackdropSchema.optional(),
  behavior: hudBehaviorSchema.optional(),
  tokens: z.record(z.string(), z.any()).optional(),
})

const placementSchema = z.union([
  z.literal('auto'),
  z.literal('top'),
  z.literal('bottom'),
  z.literal('left'),
  z.literal('right'),
  z.literal('auto-start'),
  z.literal('auto-end'),
  z.literal('top-start'),
  z.literal('top-end'),
  z.literal('bottom-start'),
  z.literal('bottom-end'),
  z.literal('left-start'),
  z.literal('left-end'),
  z.literal('right-start'),
  z.literal('right-end'),
])

const stepSchema = z.object({
  id: z.string().min(1),
  target: targetSchema,
  route: z.union([z.string(), z.instanceof(RegExp)]).optional(),
  placement: placementSchema.optional(),
  mask: maskSchema.optional(),
  targetBehavior: z
    .object({
      hidden: z.union([z.literal('screen'), z.literal('skip')]).optional(),
      hiddenDelayMs: z.number().nonnegative().optional(),
      scrollMargin: scrollMarginSchema.optional(),
      scrollMode: z
        .union([z.literal('preserve'), z.literal('start'), z.literal('center')])
        .optional(),
    })
    .optional(),
  content: z.any(),
  advance: z.array(advanceRuleSchema).optional(),
  waitFor: waitForSchema.optional(),
  onResume: z
    .custom<
      (...args: Array<unknown>) => unknown
    >((value) => typeof value === 'function')
    .optional(),
  onEnter: z
    .custom<
      (...args: Array<unknown>) => unknown
    >((value) => typeof value === 'function')
    .optional(),
  onExit: z
    .custom<
      (...args: Array<unknown>) => unknown
    >((value) => typeof value === 'function')
    .optional(),
  controls: z
    .object({
      back: controlStateSchema.optional(),
      next: controlStateSchema.optional(),
    })
    .optional(),
})

export const flowDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.number().nonnegative().int(),
  steps: z.array(stepSchema).min(1),
  hud: hudSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const validateFlowDefinition = <TContent>(
  definition: FlowDefinition<TContent>,
): FlowDefinition<TContent> => {
  return flowDefinitionSchema.parse(definition) as FlowDefinition<TContent>
}
