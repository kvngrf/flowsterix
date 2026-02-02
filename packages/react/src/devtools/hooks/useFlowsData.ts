import type { FlowDefinition, FlowState } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  getDevToolsBridge,
  subscribeDevToolsBridge,
  type DevToolsBridgeValue,
} from '../globalBridge'

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

// Use useSyncExternalStore to subscribe to the global bridge
function useBridge(): DevToolsBridgeValue | null {
  return useSyncExternalStore(
    subscribeDevToolsBridge,
    getDevToolsBridge,
    () => null, // Server snapshot
  )
}

export function useFlowsData(): UseFlowsDataResult {
  const bridge = useBridge()
  const [flowsData, setFlowsData] = useState<FlowData[]>([])

  const loadFlowStates = useCallback(async () => {
    if (!bridge) {
      setFlowsData([])
      return
    }

    const { flows, activeFlowId, state: activeState, getFlowState } = bridge
    const flowDataPromises: Promise<FlowData>[] = []

    for (const [flowId, definition] of flows) {
      const isActive = flowId === activeFlowId

      flowDataPromises.push(
        (async () => {
          // For active flow, use live state; otherwise fetch from storage
          const flowState = isActive ? activeState : await getFlowState(flowId)

          return {
            flowId,
            definition,
            state: flowState,
            isActive,
          }
        })(),
      )
    }

    const results = await Promise.all(flowDataPromises)
    setFlowsData(results)
  }, [bridge])

  // Load flows on mount and when bridge changes
  useEffect(() => {
    void loadFlowStates()
  }, [loadFlowStates])

  const deleteFlow = useCallback(
    async (flowId: string) => {
      if (!bridge) return

      // Cancel if active
      if (bridge.activeFlowId === flowId) {
        bridge.cancel()
      }

      // Delete from storage
      await bridge.deleteFlowStorage(flowId)

      // Refresh list
      await loadFlowStates()
    },
    [bridge, loadFlowStates],
  )

  const updateFlow = useCallback(
    async (flowId: string, newState: FlowState) => {
      if (!bridge) return

      await bridge.updateFlowStorage(flowId, newState)

      // Refresh list
      await loadFlowStates()
    },
    [bridge, loadFlowStates],
  )

  return {
    flows: flowsData,
    refreshFlows: loadFlowStates,
    deleteFlow,
    updateFlow,
  }
}
