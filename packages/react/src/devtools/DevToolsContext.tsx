'use client'

import type { FlowDefinition, FlowState, StorageAdapter } from '@flowsterix/core'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

export interface FlowStorageEntry {
  flowId: string
  state: FlowState | null
  definition: FlowDefinition<ReactNode>
}

export interface DevToolsContextValue {
  /** All registered flows */
  flows: Map<string, FlowDefinition<ReactNode>>
  /** Current active flow ID */
  activeFlowId: string | null
  /** Current flow state */
  state: FlowState | null
  /** Storage adapter for reading/writing flow state */
  storageAdapter: StorageAdapter | null
  /** Storage namespace prefix */
  storageNamespace: string | null
  /** Cancel a flow by ID */
  cancelFlow: (flowId: string) => void
  /** Delete flow storage entry */
  deleteFlowStorage: (flowId: string) => Promise<void>
  /** Update flow storage entry */
  updateFlowStorage: (flowId: string, state: FlowState) => Promise<void>
  /** Get current flow state from storage */
  getFlowState: (flowId: string) => Promise<FlowState | null>
}

export const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function useDevToolsContext(): DevToolsContextValue | null {
  return useContext(DevToolsContext)
}

export function useDevToolsContextRequired(): DevToolsContextValue {
  const context = useContext(DevToolsContext)
  if (!context) {
    throw new Error(
      'useDevToolsContext must be used within a TourProvider with devtools enabled'
    )
  }
  return context
}
