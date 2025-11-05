import type { FlowDefinition } from './types'
import { flowDefinitionSchema } from './validation'

export const createFlow = <TContent>(
  definition: FlowDefinition<TContent>,
): FlowDefinition<TContent> => {
  const parsed = flowDefinitionSchema.parse(
    definition,
  ) as FlowDefinition<TContent>
  return {
    ...parsed,
    steps: parsed.steps.map((step) => ({ ...step })),
  }
}
