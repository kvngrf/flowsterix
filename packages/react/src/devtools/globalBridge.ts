/**
 * Global bridge for sharing TourProvider state with DevTools.
 *
 * This is needed because Vite pre-bundles entry points separately,
 * creating different React context instances. Using window as a
 * shared namespace bypasses this issue.
 */

import type { FlowDefinition, FlowState } from '@flowsterix/core'
import type { ReactNode } from 'react'

export interface DevToolsBridgeValue {
  flows: Map<string, FlowDefinition<ReactNode>>
  activeFlowId: string | null
  state: FlowState | null
  cancel: () => void
  getFlowState: (flowId: string) => Promise<FlowState | null>
  deleteFlowStorage: (flowId: string) => Promise<void>
  updateFlowStorage: (flowId: string, state: FlowState) => Promise<void>
}

type Listener = (value: DevToolsBridgeValue | null) => void

const BRIDGE_KEY = '__FLOWSTERIX_DEVTOOLS_BRIDGE__'

interface BridgeGlobal {
  value: DevToolsBridgeValue | null
  listeners: Set<Listener>
}

const SERVER_BRIDGE: BridgeGlobal = { value: null, listeners: new Set() }

function getBridge(): BridgeGlobal {
  if (typeof window === 'undefined') {
    return SERVER_BRIDGE
  }

  const w = window as unknown as Record<string, BridgeGlobal | undefined>
  if (!w[BRIDGE_KEY]) {
    w[BRIDGE_KEY] = { value: null, listeners: new Set() }
  }
  return w[BRIDGE_KEY]
}

export function setDevToolsBridge(value: DevToolsBridgeValue | null): void {
  const bridge = getBridge()
  bridge.value = value
  for (const listener of bridge.listeners) {
    listener(value)
  }
}

export function getDevToolsBridge(): DevToolsBridgeValue | null {
  return getBridge().value
}

export function subscribeDevToolsBridge(listener: Listener): () => void {
  const bridge = getBridge()
  bridge.listeners.add(listener)
  return () => {
    bridge.listeners.delete(listener)
  }
}
