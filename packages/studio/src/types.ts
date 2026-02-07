import type {
  FlowAnalyticsHandlers,
  FlowState,
  FlowVersion,
  StepPlacement,
  StepMask,
  StepControls,
  StorageAdapter,
} from '@flowsterix/core'

// ─────────────────────────────────────────────────────────────────────────────
// Public API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserContext {
  id: string
  traits?: Record<string, unknown>
}

export interface StudioBridgeOptions {
  projectId: string
  apiKey: string
  endpoint?: string
  user?: UserContext
  debug?: boolean
  batchSize?: number
  flushIntervalMs?: number
}

export interface StudioBridge {
  analytics: FlowAnalyticsHandlers<unknown>
  storage: (params: { inner: StorageAdapter }) => StorageAdapter
  identify: (params: { user: UserContext }) => void
  flush: () => Promise<void>
  shutdown: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialized Types (JSON-safe representations)
// ─────────────────────────────────────────────────────────────────────────────

export interface SerializedAdvanceRule {
  type: string
  lockBack?: boolean
  ms?: number
  event?: string
  on?: string
  to?: string
}

export interface SerializedStep {
  id: string
  target: string
  placement?: StepPlacement
  mask?: StepMask
  controls?: StepControls
  dialogId?: string
  route?: string
  advance?: SerializedAdvanceRule[]
}

export interface SerializedFlow {
  id: string
  version: FlowVersion
  stepCount: number
  metadata?: Record<string, unknown>
  autoStart?: boolean
  resumeStrategy?: string
}

export interface SerializedError {
  code: string
  message?: string
  name?: string
  stack?: string
  meta?: Record<string, unknown>
}

export interface SerializedVersionMismatch {
  oldVersion: string
  newVersion: string
  action: string
}

export interface StudioEvent {
  type: string
  timestamp: number
  sessionId: string
  projectId: string
  user?: UserContext
  flow: SerializedFlow
  state: FlowState
  step?: SerializedStep
  previousStep?: SerializedStep
  reason?: string
  direction?: string
  error?: SerializedError
  versionMismatch?: SerializedVersionMismatch
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Transport Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Transport {
  enqueue: (event: StudioEvent) => void
  flush: () => Promise<void>
  shutdown: () => void
}
