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

const guardElementFocusRingSchema = z.object({
  boxShadow: z.string(),
})

const hudSchema = z.object({
  render: z.union([z.literal('default'), z.literal('none')]).optional(),
  popover: hudPopoverSchema.optional(),
  backdrop: hudBackdropSchema.optional(),
  behavior: hudBehaviorSchema.optional(),
  tokens: z.record(z.string(), z.any()).optional(),
  guardElementFocusRing: guardElementFocusRingSchema.optional(),
})

const resumeStrategySchema = z.union([
  z.literal('chain'),
  z.literal('current'),
])

const dialogAutoOpenSchema = z.union([
  z.boolean(),
  z.object({
    onEnter: z.boolean().optional(),
    onResume: z.boolean().optional(),
  }),
])

const dialogAutoCloseSchema = z.union([
  z.literal('differentDialog'),
  z.literal('always'),
  z.literal('never'),
])

const dialogConfigSchema = z.object({
  autoOpen: dialogAutoOpenSchema.optional(),
  autoClose: dialogAutoCloseSchema.optional(),
  onDismissGoToStepId: z.string().min(1),
})

/**
 * Flow version schema: { major: number, minor: number }
 */
const flowVersionSchema = z.object({
  major: z.number().nonnegative().int(),
  minor: z.number().nonnegative().int(),
})

const migrateFnSchema = z
  .custom<(...args: Array<unknown>) => unknown>(
    (value) => typeof value === 'function',
    { message: 'migrate must be a function' },
  )
  .optional()

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
      scrollDurationMs: z.number().nonnegative().optional(),
    })
    .optional(),
  content: z.any(),
  dialogId: z.string().min(1).optional(),
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

const baseFlowDefinitionSchema = z.object({
  id: z.string().min(1),
  version: flowVersionSchema,
  steps: z.array(stepSchema).min(1),
  dialogs: z.record(z.string(), dialogConfigSchema).optional(),
  hud: hudSchema.optional(),
  resumeStrategy: resumeStrategySchema.optional(),
  autoStart: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  migrate: migrateFnSchema,
})

export const flowDefinitionSchema = baseFlowDefinitionSchema.superRefine(
  (data, ctx) => {
    const stepIds = new Set(data.steps.map((s) => s.id))
    const dialogIds = new Set(Object.keys(data.dialogs ?? {}))

    // Validate step.dialogId references exist in flow.dialogs
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      if (step.dialogId && !dialogIds.has(step.dialogId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step "${step.id}" references dialogId "${step.dialogId}" which is not defined in flow.dialogs`,
          path: ['steps', i, 'dialogId'],
        })
      }
    }

    // Validate dialog.onDismissGoToStepId references exist in flow.steps
    if (data.dialogs) {
      for (const [dialogId, config] of Object.entries(data.dialogs)) {
        if (!stepIds.has(config.onDismissGoToStepId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Dialog "${dialogId}" references onDismissGoToStepId "${config.onDismissGoToStepId}" which is not defined in flow.steps`,
            path: ['dialogs', dialogId, 'onDismissGoToStepId'],
          })
        }
      }
    }
  },
)

export const validateFlowDefinition = <TContent>(
  definition: FlowDefinition<TContent>,
): FlowDefinition<TContent> => {
  return flowDefinitionSchema.parse(definition) as FlowDefinition<TContent>
}
