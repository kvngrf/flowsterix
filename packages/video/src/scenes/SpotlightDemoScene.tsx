import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { MockAppUI, TARGET_RECTS } from '../components/MockAppUI'
import { SpotlightOverlay } from '../components/SpotlightOverlay'
import { TourPopover } from '../components/TourPopover'

const STEPS = [
  {
    target: 'sidebar-nav' as const,
    title: 'Navigate',
    description: 'Quick access to all sections.',
    popoverPosition: { x: 260, y: 100 },
  },
  {
    target: 'main-card' as const,
    title: 'Key Metrics',
    description: 'Track what matters most.',
    popoverPosition: { x: 400, y: 240 },
  },
  {
    target: 'header-avatar' as const,
    title: 'Settings',
    description: 'Customize your experience.',
    popoverPosition: { x: 1400, y: 80 },
  },
]

// Faster step transitions for 10s scene
const FRAMES_PER_STEP = 100

export const SpotlightDemoScene = () => {
  const frame = useCurrentFrame()

  const currentStepIndex = Math.min(
    Math.floor(frame / FRAMES_PER_STEP),
    STEPS.length - 1
  )
  const previousStepIndex = Math.max(0, currentStepIndex - 1)

  const stepStartFrame = currentStepIndex * FRAMES_PER_STEP
  const currentStep = STEPS[currentStepIndex]
  const previousStep = STEPS[previousStepIndex]

  const targetRect = TARGET_RECTS[currentStep.target]
  const previousRect =
    currentStepIndex > 0 ? TARGET_RECTS[previousStep.target] : undefined

  return (
    <AbsoluteFill>
      <MockAppUI highlightTarget={currentStep.target} />

      <SpotlightOverlay
        targetRect={targetRect}
        previousRect={previousRect}
        padding={14}
        transitionStartFrame={stepStartFrame}
      />

      <TourPopover
        title={currentStep.title}
        description={currentStep.description}
        stepNumber={currentStepIndex + 1}
        totalSteps={STEPS.length}
        position={currentStep.popoverPosition}
        enterFrame={stepStartFrame}
      />
    </AbsoluteFill>
  )
}
