---
name: react-integration
description: TourProvider, hooks, TourHUD, and step content components
---

# React Integration

## TourProvider

Root provider that manages tour state and flow definitions.

```tsx
import { TourProvider } from '@flowsterix/react'

<TourProvider
  flows={[flow1, flow2]}           // Required: flow definitions
  storageNamespace="my-app"        // localStorage key prefix
  storageAdapter={adapter}         // Custom storage (default: localStorage)
  persistOnChange={true}           // Auto-persist state changes
  backdropInteraction="block"      // 'block' | 'passthrough'
  lockBodyScroll={false}           // Prevent body scroll during tour
  defaultDebug={false}             // Enable debug mode
  labels={{                        // Customize button labels
    next: 'Continue',
    back: 'Previous',
    skip: 'Exit Tour',
    finish: 'Done',
  }}
  analytics={{                     // Event tracking
    onFlowStart: (p) => analytics.track('tour_started', p),
    onFlowComplete: (p) => analytics.track('tour_completed', p),
    onStepEnter: (p) => analytics.track('step_viewed', p),
  }}
  onVersionMismatch={(info) => {   // Handle version conflicts
    console.log('Flow version changed:', info)
  }}
>
  {children}
</TourProvider>
```

## useTour Hook

Main hook for accessing tour state and controls.

```tsx
import { useTour } from '@flowsterix/react'

function MyComponent() {
  const {
    // State
    flows,           // Map<string, FlowDefinition>
    activeFlowId,    // string | null
    state,           // FlowState | null
    activeStep,      // Step | null

    // Controls
    startFlow,       // (flowId: string, options?) => FlowState
    next,            // () => FlowState
    back,            // () => FlowState
    goToStep,        // (indexOrId: number | string) => FlowState
    pause,           // () => FlowState
    resume,          // () => FlowState
    cancel,          // (reason?: 'skipped' | 'keyboard') => FlowState
    complete,        // () => FlowState

    // Events
    events,          // EventBus<FlowEvents>

    // Debug
    debugEnabled,
    toggleDebug,

    // Delay info (for progress bars)
    delayInfo,       // { remainingMs, totalMs, flowId } | null
  } = useTour()

  return (
    <button onClick={() => startFlow('onboarding')}>
      Start Tour
    </button>
  )
}
```

### Start Options

```tsx
startFlow('my-flow', {
  fromStepId: 'specific-step',     // Start from specific step
  fromStepIndex: 2,                // Or by index
  resume: true,                    // Use onResume hooks
  resumeStrategy: 'chain',         // 'chain' | 'current'
})
```

## useTourEvents Hook

Subscribe to flow events.

```tsx
import { useTourEvents } from '@flowsterix/react'

function Analytics() {
  useTourEvents('flowStart', (payload) => {
    console.log('Tour started:', payload.flow.id)
  })

  useTourEvents('stepEnter', (payload) => {
    console.log('Step entered:', payload.currentStep.id)
  })

  useTourEvents('flowComplete', (payload) => {
    console.log('Tour completed:', payload.flow.id)
  })

  return null
}
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

## TourHUD Component

Complete heads-up display with overlay, popover, and controls.

```tsx
import { TourHUD } from '@flowsterix/react'

<TourHUD
  // Overlay (spotlight) configuration
  overlay={{
    padding: 12,              // Padding around highlight
    radius: 12,               // Border radius of cutout
    backdropColor: 'rgba(0,0,0,0.5)',
    blurAmount: 6,            // Backdrop blur pixels
    opacity: 1,
    showRing: true,           // Glow effect around target
    ringShadow: '0 0 0 2px hsl(var(--primary))',
    zIndex: 2000,
  }}

  // Popover configuration
  popover={{
    offset: 16,               // Distance from target
    placement: 'bottom',      // Default placement
    width: 320,               // Fixed width
    maxWidth: 360,            // Max width
    zIndex: 2002,
    showDragHandle: true,     // Draggable popover
  }}

  // Navigation controls
  controls={{
    showSkip: true,
    skipMode: 'hold',         // 'click' | 'hold'
    skipHoldDurationMs: 1000, // Hold duration
    labels: {
      back: 'Previous',
      next: 'Continue',
      finish: 'Done',
      skip: 'Exit',
    },
    primaryVariant: 'default',
    secondaryVariant: 'ghost',
  }}

  // Progress indicator
  progress={{
    show: true,
    variant: 'dots',          // 'dots' | 'bar' | 'fraction' | 'steps'
    position: 'bottom',       // 'top' | 'bottom'
    size: 'sm',               // 'sm' | 'md' | 'lg'
  }}

  // Keyboard shortcuts
  shortcuts={{
    escape: false,            // Disable Esc to close
    arrowKeys: true,          // Navigate with arrows
  }}

  // Custom content rendering
  renderContent={(step) => <CustomStepContent step={step} />}
/>
```

## Step Content Components

Consistent typography for step content.

```tsx
import {
  StepContent,
  StepTitle,
  StepText,
  StepHint,
} from '@/components/step-content'

// In flow definition
content: (
  <StepContent>
    <StepTitle size="lg">Welcome!</StepTitle>
    <StepText>This is the main description.</StepText>
    <StepHint>Click Next to continue.</StepHint>
  </StepContent>
)
```

## useDelayAdvance Hook

Track countdown for delay-based advance rules.

```tsx
import { useDelayAdvance } from '@flowsterix/react'

function CountdownBar() {
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
}
```

## useTourControls Hook

Pre-computed control states.

```tsx
import { useTourControls } from '@flowsterix/react'

function CustomControls() {
  const {
    canGoBack,
    canGoNext,
    isFirstStep,
    isLastStep,
    handleBack,
    handleNext,
    handleSkip,
  } = useTourControls()

  return (
    <div>
      <button onClick={handleBack} disabled={!canGoBack}>Back</button>
      <button onClick={handleNext}>{isLastStep ? 'Finish' : 'Next'}</button>
    </div>
  )
}
```

## useHudState Hook

Low-level HUD rendering state.

```tsx
import { useHudState } from '@flowsterix/react'

function CustomHUD() {
  const {
    state,           // FlowState | null
    runningStep,     // Step | null
    shouldRender,    // boolean (includes exit animation buffer)
    hudTarget,       // Target info with fallback handling
    hudRenderMode,   // 'default' | 'none'
  } = useHudState()

  if (!shouldRender) return null

  return <div>Custom HUD: {runningStep?.id}</div>
}
```
