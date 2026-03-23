---
name: react-api
description: TourProvider configuration, useTour hook, TourHUD component, and React hooks API for Flowsterix. Use when configuring TourProvider props, accessing tour state, customizing TourHUD, or building custom tour controls.
metadata:
  sources:
    - docs/guides/devtools.md
    - docs/guides/mobile.md
---

# React API

## TourProvider

Root provider that manages tour state and flow definitions.

```tsx
<TourProvider
  flows={[flow1, flow2]}           // Required: flow definitions
  storageNamespace="my-app"        // localStorage key prefix
  storageAdapter={adapter}         // Custom storage (default: localStorage)
  persistOnChange={true}           // Auto-persist state changes
  backdropInteraction="block"      // 'block' | 'passthrough'
  lockBodyScroll={false}           // Prevent body scroll during tour
  labels={{
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    skip: 'Skip tour',
  }}
  analytics={{
    onFlowStart: (p) => track('tour_start', p),
    onStepEnter: (p) => track('step_view', p),
    onFlowComplete: (p) => track('tour_completed', p),
    onFlowCancel: (p) => track('tour_cancelled', p),
  }}
  onVersionMismatch={(info) => {
    console.log('Flow version changed:', info)
  }}
>
  {children}
</TourProvider>
```

## useTour Hook

Main hook for accessing tour state and controls.

```tsx
const {
  // State
  flows,              // Map<string, FlowDefinition>
  activeFlowId,       // string | null
  state,              // FlowState | null
  activeStep,         // Step | null
  activeDialogConfig, // DialogConfig | undefined
  delayInfo,          // { remainingMs, totalMs, flowId } | null

  // Controls
  startFlow,          // (flowId, options?) => FlowState
  next,               // () => FlowState
  back,               // () => FlowState
  goToStep,           // (indexOrId) => FlowState
  pause,              // () => FlowState
  resume,             // () => FlowState
  cancel,             // (reason?) => FlowState
  complete,           // () => FlowState
  advanceStep,        // (stepId) => FlowState | null

  // Events & Debug
  events,             // EventBus<FlowEvents>
  debugEnabled,
  toggleDebug,
} = useTour()
```

### Conditional Advance with advanceStep

Use `advanceStep(stepId)` to advance only if on a specific step:

```tsx
const { advanceStep } = useTour()

const handleLogoUpload = async (file: File) => {
  await uploadLogo(file)
  advanceStep('change-logo')  // Only advances if tour is on 'change-logo'
}
```

- If on the specified step: advances to next (or completes if last)
- If on a different step: silent no-op
- If no active flow: returns `null` (safe to call without checking)

### Start Options

```tsx
startFlow('my-flow', {
  fromStepId: 'specific-step',
  fromStepIndex: 2,
  resume: true,
  resumeStrategy: 'chain',  // 'chain' | 'current'
})
```

## TourHUD Component

Complete heads-up display with overlay, popover, and controls.

```tsx
<TourHUD
  overlay={{
    padding: 12,
    radius: 12,
    backdropColor: 'rgba(0,0,0,0.5)',
    showRing: true,
    ringShadow: '0 0 0 2px rgba(56,189,248,0.4), 0 0 16px 4px rgba(56,189,248,0.15)',
    zIndex: 2000,
  }}
  popover={{
    offset: 32,
    maxWidth: 360,
    zIndex: 2002,
  }}
  controls={{
    showSkip: true,
    skipMode: 'hold',          // 'click' | 'hold'
    skipHoldDurationMs: 1000,
  }}
  progress={{
    show: true,
    variant: 'dots',           // 'dots' | 'bar' | 'fraction' | 'steps'
  }}
  shortcuts={{
    escape: false,
    arrowKeys: true,
  }}
  mobile={{
    enabled: true,
    breakpoint: 640,
    defaultSnapPoint: 'expanded',
    snapPoints: ['minimized', 'expanded'],
    allowMinimize: true,
  }}
/>
```

**Overlay rendering model:** Unified SVG-based overlay with box-shadow glow on highlight ring. Customize via `padding`, `radius`, `showRing`, `ringShadow`. Theme with `--tour-overlay-ring-shadow` CSS variable.

## useTourEvents Hook

```tsx
import { useTourEvents } from '@flowsterix/react'

useTourEvents('flowStart', (payload) => {
  console.log('Tour started:', payload.flow.id)
})

useTourEvents('stepEnter', (payload) => {
  console.log('Step entered:', payload.currentStep.id)
})
```

### Available Events

| Event | Payload |
|-------|---------|
| `flowStart` | `{ flow, state }` |
| `flowResume` | `{ flow, state }` |
| `flowPause` | `{ flow, state }` |
| `flowCancel` | `{ flow, state, reason? }` |
| `flowComplete` | `{ flow, state }` |
| `stepEnter` | `{ flow, state, currentStep, reason }` |
| `stepExit` | `{ flow, state, previousStep, reason }` |
| `stepChange` | `{ flow, state, step, previousStep }` |
| `stateChange` | `{ flow, state }` |
| `flowError` | `{ flow, state, code, error }` |

## useTourControls Hook

Pre-computed control states for custom UIs.

```tsx
const {
  canGoBack,
  canGoNext,
  isFirstStep,
  isLastStep,
  handleBack,
  handleNext,
  handleSkip,
} = useTourControls()
```

## useDelayAdvance Hook

Track countdown for delay-based advance rules.

```tsx
const { remainingMs, totalMs, flowId, fractionElapsed } = useDelayAdvance()

if (!flowId || totalMs <= 0) return null

return (
  <div className="h-1 bg-muted rounded overflow-hidden">
    <div
      className="h-full bg-primary transition-all"
      style={{ width: `${fractionElapsed * 100}%` }}
    />
  </div>
)
```

## useHudState Hook

Low-level HUD rendering state for custom implementations.

```tsx
const {
  state,          // FlowState | null
  runningStep,    // Step | null
  shouldRender,   // boolean
  hudTarget,      // Target info with fallback handling
  hudRenderMode,  // 'default' | 'none'
} = useHudState()
```

## DevTools

The `@flowsterix/react/devtools` subpath provides development tools:

```tsx
import { DevToolsProvider } from '@flowsterix/react/devtools'

function App() {
  return (
    <TourProvider flows={[...]}>
      <DevToolsProvider enabled={process.env.NODE_ENV === 'development'}>
        <YourApp />
      </DevToolsProvider>
    </TourProvider>
  )
}
```

- **Steps tab** - `Ctrl+Shift+G` to toggle grab mode, click elements to capture, copy JSON for AI
- **Flows tab** - View/edit stored flow states for debugging

### AI Workflow

1. Capture elements with devtools grab mode
2. Copy the JSON export
3. Paste into AI with: "Create a Flowsterix tour flow for these elements"
4. AI generates flow definition with proper `data-tour-target` selectors

## Error Handling

```tsx
useTourEvents('flowError', (payload) => {
  // payload.code: 'storage.persist_failed' | 'flow.step_not_found' | ...
  Sentry.captureException(payload.error, {
    tags: { flowId: payload.flow.id, errorCode: payload.code },
  })
})
```

| Code | Meaning |
|------|---------|
| `storage.persist_failed` | Could not save state |
| `storage.hydrate_failed` | Could not load state |
| `flow.step_not_found` | goToStep with invalid ID |
| `flow.migration_failed` | migrate() threw error |
| `dialog.not_mounted` | Step references dialogId but no dialog mounted |

## FlowState Reference

```tsx
interface FlowState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled'
  stepIndex: number
  version: string          // "major.minor"
  stepId?: string
  updatedAt: number
  cancelReason?: 'skipped' | 'keyboard'
}
```
