import { AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'

import {
  OverlayBackdrop,
  TourFocusManager,
  TourPopoverPortal,
  useHudMotion,
  useTourControls,
  useTourHud,
  useTourOverlay,
} from '@flowsterix/headless'

import { HoldToSkipButton } from './HoldToSkipButton'

const SKIP_HOLD_DURATION_MS = 1_000

export const HeadlessHUD = () => {
  const isBrowser =
    typeof window !== 'undefined' && typeof document !== 'undefined'
  const portalTarget = isBrowser ? document.body : null

  const hud = useTourHud()
  const { hudState, popover, description, focusManager, targetIssue, overlay } =
    hud
  const { runningStep, shouldRender, hudTarget, hudRenderMode, activeFlowId } =
    hudState
  const isHeadlessFlow = hudRenderMode === 'none' && Boolean(activeFlowId)
  const hudEnabled = isHeadlessFlow && shouldRender
  const controls = useTourControls()
  const { components, transitions } = useHudMotion()
  const { MotionDiv, MotionSection } = components
  const {
    highlight: highlightTransition,
    overlayFade: overlayFadeTransition,
    popoverEntrance: popoverEntranceTransition,
    popoverExit: popoverExitTransition,
    popoverContent: popoverContentTransition,
  } = transitions

  const overlayShade = 'rgba(2,6,23,0.65)'
  const overlayBlur = 10
  const overlayGeometry = useTourOverlay({
    target: hudTarget,
    padding: overlay.padding ?? 10,
    radius: overlay.radius ?? 20,
    interactionMode: overlay.interactionMode,
  })

  if (!hudEnabled || !runningStep) return null
  if (!portalTarget) return null

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginTop: '1rem',
  }

  const issueStyle = {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: '0.75rem',
    background: 'rgba(255,160,67,0.08)',
    border: '1px solid rgba(255,160,67,0.45)',
    color: '#ffd9b3',
  }

  const buttonStyle = (variant: 'primary' | 'ghost') => ({
    flex: variant === 'ghost' ? '0' : '1',
    padding: '0.55rem 1rem',
    borderRadius: '999px',
    border: variant === 'ghost' ? '1px solid rgba(233,251,242,0.4)' : 'none',
    background:
      variant === 'ghost'
        ? 'transparent'
        : 'linear-gradient(120deg, rgba(82,255,168,0.95), rgba(49,148,255,0.95))',
    color: variant === 'ghost' ? '#e9fbf2' : '#041018',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: variant === 'primary' && !controls.canGoNext ? 0.6 : 1,
  })

  return createPortal(
    <div data-headless-hud="">
      <TourFocusManager
        active={focusManager.active}
        target={focusManager.target}
        popoverNode={focusManager.popoverNode}
      />
      <OverlayBackdrop
        overlay={overlayGeometry}
        zIndex={2000}
        color={overlayShade}
        opacity={1}
        blurAmount={overlayBlur}
        shadow={
          '0 0 0 2px rgba(82,255,168,0.9), 0 0 25px rgba(82,255,168,0.8), 0 0 70px rgba(82,255,168,0.45)'
        }
        transitionsOverride={{
          overlayHighlight: highlightTransition,
          overlayFade: overlayFadeTransition,
        }}
      />
      <AnimatePresence>
        <TourPopoverPortal
          target={hudTarget}
          offset={popover.offset}
          placement={popover.placement}
          width={popover.width}
          maxWidth={popover.maxWidth}
          zIndex={2002}
          role={popover.role}
          ariaModal={Boolean(popover.ariaModal)}
          ariaLabel={popover.ariaLabel}
          ariaDescribedBy={description.combinedAriaDescribedBy}
          descriptionId={description.descriptionId}
          descriptionText={description.text ?? undefined}
          onContainerChange={focusManager.setPopoverNode}
          containerComponent={MotionSection}
          contentComponent={MotionDiv}
          layoutId="popover"
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
          }) => {
            const { key: contentKey, ...restContentProps } = contentProps
            return (
              <Container
                {...containerProps}
                style={{
                  ...containerProps.style,
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  minWidth: '280px',
                  maxWidth: '360px',
                  background: 'rgba(5, 12, 25, 0.95)',
                  border: '1px solid rgba(82,255,168,0.4)',
                  boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
                  color: '#e9fbf2',
                }}
              >
                {descriptionProps.id && descriptionProps.text ? (
                  <span id={descriptionProps.id} className="sr-only">
                    {descriptionProps.text}
                  </span>
                ) : null}
                <div className="relative" data-tour-popover-shell="">
                  <AnimatePresence mode="popLayout">
                    <Content
                      key={contentKey}
                      {...restContentProps}
                      style={{
                        ...restContentProps.style,
                        display: 'grid',
                        gap: '0.75rem',
                      }}
                    >
                      {description.text ? (
                        <p
                          id={description.descriptionId ?? undefined}
                          style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            color: 'rgba(233,251,242,0.8)',
                          }}
                        >
                          {description.text}
                        </p>
                      ) : null}
                      {runningStep.content}
                      {targetIssue.issue ? (
                        <div style={issueStyle}>
                          <strong
                            style={{
                              display: 'block',
                              marginBottom: '0.25rem',
                            }}
                          >
                            {targetIssue.issue.title}
                          </strong>
                          <p style={{ margin: 0, lineHeight: 1.4 }}>
                            {targetIssue.issue.body}
                          </p>
                          {targetIssue.issue.hint ? (
                            <p
                              style={{
                                margin: '0.4rem 0 0',
                                fontSize: '0.85rem',
                                opacity: 0.9,
                              }}
                            >
                              {targetIssue.issue.hint}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div style={controlsStyle}>
                        <button
                          type="button"
                          onClick={controls.goBack}
                          disabled={!controls.canGoBack}
                          style={{
                            ...buttonStyle('ghost'),
                            opacity: controls.canGoBack ? 1 : 0.4,
                          }}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={controls.goNext}
                          disabled={!controls.canGoNext}
                          style={buttonStyle('primary')}
                        >
                          {controls.canGoNext ? 'Next' : 'Finish'}
                        </button>
                        <HoldToSkipButton
                          label="Skip"
                          holdDurationMs={SKIP_HOLD_DURATION_MS}
                          onConfirm={() =>
                            controls.cancel(activeFlowId ?? undefined)
                          }
                        />
                      </div>
                    </Content>
                  </AnimatePresence>
                </div>
              </Container>
            )
          }}
        </TourPopoverPortal>
      </AnimatePresence>
    </div>,
    portalTarget,
  )
}
