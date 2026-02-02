import type { FlowDefinition, FlowState } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDevToolsContext } from '../DevToolsContext'

export interface FlowData {
  flowId: string
  definition: FlowDefinition<ReactNode>
  state: FlowState | null
  isActive: boolean
}

export interface UseFlowsDataResult {
  flows: FlowData[]
  refreshFlows: () => Promise<void>
  deleteFlow: (flowId: string) => Promise<void>
  updateFlow: (flowId: string, state: FlowState) => Promise<void>
}

export function useFlowsData(): UseFlowsDataResult {
  const devtools = useDevToolsContext()
  const [flowsData, setFlowsData] = useState<FlowData[]>([])

  const loadFlowStates = useCallback(async () => {
    if (!devtools) {
      setFlowsData([])
      return
    }

    const { flows, activeFlowId, state: activeState, getFlowState } = devtools
    const flowDataPromises: Promise<FlowData>[] = []

    for (const [flowId, definition] of flows) {
      const isActive = flowId === activeFlowId

      flowDataPromises.push(
        (async () => {
          // For active flow, use live state; otherwise fetch from storage
          const flowState = isActive
            ? activeState
            : await getFlowState(flowId)

          return {
            flowId,
            definition,
            state: flowState,
            isActive,
          }
        })()
      )
    }

    const results = await Promise.all(flowDataPromises)
    setFlowsData(results)
  }, [devtools])

  // Load flows on mount and when devtools context changes
  useEffect(() => {
    void loadFlowStates()
  }, [loadFlowStates])

  // Refresh when active flow state changes
  useEffect(() => {
    if (!devtools?.activeFlowId || !devtools?.state) return
    void loadFlowStates()
  }, [devtools?.activeFlowId, devtools?.state, loadFlowStates])

  const deleteFlow = useCallback(
    async (flowId: string) => {
      if (!devtools) return

      // Cancel if active
      devtools.cancelFlow(flowId)

      // Delete from storage
      await devtools.deleteFlowStorage(flowId)

      // Refresh list
      await loadFlowStates()
    },
    [devtools, loadFlowStates]
  )

  const updateFlow = useCallback(
    async (flowId: string, state: FlowState) => {
      if (!devtools) return

      await devtools.updateFlowStorage(flowId, state)

      // Refresh list
      await loadFlowStates()
    },
    [devtools, loadFlowStates]
  )

  return {
    flows: flowsData,
    refreshFlows: loadFlowStates,
    deleteFlow,
    updateFlow,
  }
}
