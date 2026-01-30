'use client'

import type { Step, StepPlacement } from '@flowsterix/core'
import type { UseHudShortcutsOptions } from '@flowsterix/react'
import {
  OverlayBackdrop,
  TourFocusManager,
  TourPopoverPortal,
  useHudMotion,
  useTourHud,
  useTourOverlay,
} from '@flowsterix/react'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { TourControls } from '@/registry/flowsterix/tour-controls'
import { TourPopoverHandle } from '@/registry/flowsterix/tour-popover-handle'
import { TourProgress } from '@/registry/flowsterix/tour-progress'

// =============================================================================
// Types
// =============================================================================

export interface TourHUDProps {
  /** Additional class names for the popover */
  className?: string
  /** Overlay configuration */
  overlay?: {
    /** Padding around the highlighted target (default: 12) */
    padding?: number
    /** Border radius of the highlight cutout (default: 12) */
    radius?: number
    /** Background color of the overlay */
    backdropColor?: string
    /** Backdrop blur amount in pixels (default: 6) */
    blurAmount?: number
    /** Opacity of the backdrop (default: 1) */
    opacity?: number
    /** Whether to show the highlight ring (default: true) */
    showRing?: boolean
    /** Custom box-shadow for the highlight ring */
    ringShadow?: string
    /** Z-index for the overlay (default: 2000) */
    zIndex?: number
  }
  /** Popover configuration */
  popover?: {
    /** Offset distance from the target (default: 16) */
    offset?: number
    /** Preferred placement relative to target */
    placement?: StepPlacement
    /** Fixed width for the popover */
    width?: number | string
    /** Maximum width for the popover (default: 360) */
    maxWidth?: number | string
    /** Z-index for the popover (default: 2002) */
    zIndex?: number
    /** Additional class names for the popover container */
    className?: string
    /** Additional class names for the content wrapper */
    contentClassName?: string
    /** Whether to show the drag handle (default: true) */
    showDragHandle?: boolean
  }
  /** Controls configuration */
  controls?: {
    /** Whether to show the skip button (default: true) */
    showSkip?: boolean
    /** Skip button mode: 'click' for instant skip, 'hold' for hold-to-confirm (default: 'click') */
    skipMode?: 'click' | 'hold'
    /** Duration in ms to hold skip button when skipMode is 'hold' (default: 1000) */
    skipHoldDurationMs?: number
    /** Custom labels for buttons */
    labels?: {
      back?: string
      next?: string
      finish?: string
      skip?: string
    }
    /** Button variant for primary action */
    primaryVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
    /** Button variant for secondary actions */
    secondaryVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
  }
  /** Progress indicator configuration */
  progress?: {
    /** Whether to show progress indicator (default: true) */
    show?: boolean
    /** Progress variant */
    variant?: 'dots' | 'bar' | 'fraction' | 'steps'
    /** Position within the popover */
    position?: 'top' | 'bottom'
    /** Size of the progress indicator */
    size?: 'sm' | 'md' | 'lg'
  }
  /** Keyboard shortcut configuration */
  shortcuts?: boolean | UseHudShortcutsOptions
  /** Custom content to render inside the popover (overrides step content) */
  children?: React.ReactNode
  /** Custom step content renderer */
  renderContent?: (step: Step<React.ReactNode>) => React.ReactNode
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * A complete heads-up display combining overlay, popover, controls, and progress.
 * This is the recommended starting point for most tour implementations.
 *
 * Features:
 * - SVG mask-based spotlight overlay with smooth spring animations
 * - Backdrop blur and highlight ring effects
 * - Smart popover positioning with floating/docked/mobile layouts
 * - Focus management for accessibility
 * - Step progress indicator
 * - Navigation controls with proper state management
 *
 * @example
 * ```tsx
 * import { TourProvider } from "@/components/tour/tour-provider"
 * import { TourHUD } from "@/components/tour/blocks/tour-hud"
 * import { myFlow } from "@/lib/tours/my-flow"
 *
 * export function App() {
 *   return (
 *     <TourProvider flows={[myFlow]}>
 *       <TourHUD
 *         overlay={{ padding: 12, showRing: true, blurAmount: 6 }}
 *         popover={{ maxWidth: 360 }}
 *         progress={{ show: true, variant: "dots" }}
 *       />
 *       <YourApp />
 *     </TourProvider>
 *   )
 * }
 * ```
 */
export function TourHUD({
  className,
  overlay = { showRing: true, blurAmount: 6, zIndex: 2000, opacity: 1 },
  popover = {},
  controls = {},
  progress = { show: false, variant: 'dots', position: 'bottom', size: 'sm' },
  shortcuts = { escape: false },
  children,
  renderContent,
}: TourHUDProps) {
  const isBrowser =
    typeof window !== 'undefined' && typeof document !== 'undefined'
  const portalTarget = isBrowser ? document.body : null

  const hud = useTourHud({ shortcuts })
  const {
    hudState,
    popover: popoverConfig,
    description,
    focusManager,
    targetIssue,
    overlay: overlayConfig,
  } = hud
  const {
    runningStep,
    shouldRender,
    hudTarget,
    hudRenderMode,
    activeFlowId,
    isInGracePeriod,
  } = hudState

  // Enable HUD for headless flows (hud: { render: 'none' }) or default flows
  const isHeadlessFlow = hudRenderMode === 'none' && Boolean(activeFlowId)
  const isDefaultFlow = hudRenderMode !== 'none' && shouldRender
  const hudEnabled = (isHeadlessFlow || isDefaultFlow) && shouldRender

  const { components, transitions } = useHudMotion()
  const { MotionDiv, MotionSection } = components
  const {
    highlight: highlightTransition,
    overlayFade: overlayFadeTransition,
    popoverEntrance: popoverEntranceTransition,
    popoverExit: popoverExitTransition,
    popoverContent: popoverContentTransition,
  } = transitions

  // Overlay configuration with defaults
  const overlayPadding = overlay.padding ?? overlayConfig.padding ?? 12
  const overlayRadius = overlay.radius ?? overlayConfig.radius ?? 12
  const overlayZIndex = overlay.zIndex
  const overlayColor = overlay.backdropColor ?? 'rgba(0, 0, 0, 0.5)'
  const overlayBlur = overlay.blurAmount
  const overlayOpacity = overlay.opacity
  const showRing = overlay.showRing
  const ringShadow =
    overlay.ringShadow ??
    '0 0 0 2px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)'

  // Compute overlay geometry
  const overlayGeometry = useTourOverlay({
    target: hudTarget,
    padding: overlayPadding,
    radius: overlayRadius,
    interactionMode: overlayConfig.interactionMode,
    isInGracePeriod,
  })

  // Popover configuration with defaults
  const popoverOffset = popover.offset ?? popoverConfig.offset
  const popoverPlacement =
    runningStep?.placement ??
    popover.placement ??
    popoverConfig.placement ??
    'bottom'
  const popoverWidth = popover.width ?? popoverConfig.width
  const popoverMaxWidth = popover.maxWidth ?? popoverConfig.maxWidth ?? 360
  const popoverZIndex = popover.zIndex ?? 2002

  if (!hudEnabled || !runningStep) return null
  if (!portalTarget) return null

  const stepContent = renderContent
    ? renderContent(runningStep)
    : runningStep.content

  return createPortal(
    <div data-tour-hud="">
      {/* Focus management for accessibility */}
      <TourFocusManager
        active={focusManager.active}
        target={focusManager.target}
        popoverNode={focusManager.popoverNode}
        highlightRect={overlayGeometry.highlight.rect}
        guardElementFocusRing={focusManager.guardElementFocusRing}
      />

      {/* Spotlight overlay with SVG masking and animations */}
      <OverlayBackdrop
        overlay={overlayGeometry}
        zIndex={overlayZIndex}
        color={overlayColor}
        opacity={overlayOpacity}
        blurAmount={overlayBlur}
        shadow={showRing ? ringShadow : undefined}
        transitionsOverride={{
          overlayHighlight: highlightTransition,
          overlayFade: overlayFadeTransition,
        }}
      />

      {/* Content popover with smart positioning */}
      <AnimatePresence>
        <TourPopoverPortal
          target={hudTarget}
          offset={popoverOffset}
          placement={popoverPlacement}
          width={popoverWidth}
          maxWidth={popoverMaxWidth}
          zIndex={popoverZIndex}
          role={popoverConfig.role}
          ariaModal={Boolean(popoverConfig.ariaModal)}
          ariaLabel={popoverConfig.ariaLabel}
          ariaDescribedBy={description.combinedAriaDescribedBy}
          descriptionId={description.descriptionId}
          descriptionText={description.text ?? undefined}
          onContainerChange={focusManager.setPopoverNode}
          containerComponent={MotionSection}
          contentComponent={MotionDiv}
          layoutId="popover"
          isInGracePeriod={isInGracePeriod}
          transitionsOverride={{
            popoverEntrance: popoverEntranceTransition,
            popoverExit: popoverExitTransition,
            popoverContent: popoverContentTransition,
          }}
        >
          {({
            Container,
            Content,
            containerProps,
            contentProps,
            descriptionProps,
            layoutMode,
            dragHandleProps,
            isDragging,
          }) => {
            const { key: contentKey, ...restContentProps } = contentProps
            const shouldShowHandle = popover.showDragHandle ?? true
            const showHandleInLayout =
              layoutMode === 'docked' || layoutMode === 'manual'
            return (
              <Container
                {...containerProps}
                className={cn(
                  'rounded-xl border bg-popover text-popover-foreground shadow-lg',
                  popover.className,
                  className,
                )}
              >
                {/* Screen reader description */}
                {descriptionProps.id && descriptionProps.text && (
                  <span id={descriptionProps.id} className="sr-only">
                    {descriptionProps.text}
                  </span>
                )}

                <motion.div
                  className="relative overflow-hidden"
                  data-tour-popover-shell=""
                >
                  {shouldShowHandle && showHandleInLayout ? (
                    <TourPopoverHandle
                      dragHandleProps={dragHandleProps}
                      isDragging={isDragging}
                    />
                  ) : null}
                  <AnimatePresence mode="popLayout">
                    <Content
                      key={contentKey}
                      {...restContentProps}
                      className={cn(
                        'p-4 space-y-3 overflow-hidden',
                        popover.contentClassName,
                      )}
                    >
                      {/* Progress indicator (top position) */}
                      {progress.show && progress.position === 'top' && (
                        <TourProgress
                          variant={progress.variant}
                          size={progress.size}
                        />
                      )}

                      {/* Step content */}
                      <motion.div layout="position">
                        {children ?? stepContent}
                      </motion.div>

                      {/* Target issue warning */}
                      {targetIssue.issue && (
                        <div
                          className="mt-3 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700"
                          role="status"
                          aria-live="polite"
                        >
                          <strong className="block mb-1">
                            {targetIssue.issue.title}
                          </strong>
                          <p className="text-sm leading-relaxed">
                            {targetIssue.issue.body}
                          </p>
                          {targetIssue.issue.hint && (
                            <p className="mt-1 text-xs opacity-90">
                              {targetIssue.issue.hint}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Progress indicator (bottom position - default) */}
                      {progress.show && progress.position !== 'top' && (
                        <TourProgress
                          variant={progress.variant}
                          size={progress.size}
                        />
                      )}
                    </Content>
                  </AnimatePresence>
                  <TourControls
                    showSkip={controls.showSkip}
                    skipMode={controls.skipMode}
                    skipHoldDurationMs={controls.skipHoldDurationMs}
                    labels={controls.labels}
                    primaryVariant={controls.primaryVariant}
                    secondaryVariant={controls.secondaryVariant}
                  />
                </motion.div>
              </Container>
            )
          }}
        </TourPopoverPortal>
      </AnimatePresence>
    </div>,
    portalTarget,
  )
}
