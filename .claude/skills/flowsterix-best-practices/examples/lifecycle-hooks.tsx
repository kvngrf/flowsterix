/**
 * Lifecycle Hooks Example
 *
 * Demonstrates UI synchronization approaches:
 * 1. Declarative: useRadixTourDialog + dialogId (for Radix dialogs)
 * 2. Imperative: onEnter/onResume/onExit hooks (for menus, accordions, etc.)
 */

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import { useRadixTourDialog, waitForDom } from '@flowsterix/react'
import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

// ============================================================================
// DIALOGS: Use useRadixTourDialog (declarative)
// ============================================================================

// Dialog component using useRadixTourDialog
function SettingsDialog({ children }: { children: ReactNode }) {
  const { dialogProps, contentProps } = useRadixTourDialog({ dialogId: 'settings' })

  return (
    <Dialog.Root {...dialogProps}>
      <Dialog.Trigger data-tour-target="dialog-trigger">Settings</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content {...contentProps} data-tour-target="dialog-content">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Flow with declarative dialog config
export const dialogFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'dialog-demo',
  version: { major: 1, minor: 0 },
  dialogs: {
    settings: {
      autoOpen: true,
      autoClose: 'differentDialog',
      onDismissGoToStepId: 'dialog-trigger',
    },
  },
  steps: [
    {
      id: 'dialog-trigger',
      target: { selector: '[data-tour-target="dialog-trigger"]' },
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: <p>Click to open the settings dialog.</p>,
    },
    {
      id: 'dialog-tab1',
      dialogId: 'settings', // Dialog auto-opens
      target: { selector: '[data-tour-target="tab1"]' },
      advance: [{ type: 'manual' }],
      content: <p>First tab in the dialog.</p>,
    },
    {
      id: 'dialog-tab2',
      dialogId: 'settings', // Dialog stays open (same dialogId)
      target: { selector: '[data-tour-target="tab2"]' },
      advance: [{ type: 'manual' }],
      content: <p>Second tab - dialog stayed open!</p>,
    },
    {
      id: 'done',
      target: 'screen', // Dialog auto-closes (no dialogId)
      advance: [{ type: 'manual' }],
      content: <p>Dialog closed automatically.</p>,
    },
  ],
})

// ============================================================================
// MENUS & ACCORDIONS: Use lifecycle hooks (imperative)
// ============================================================================

const ensureMenuOpen = async () => {
  if (typeof document === 'undefined') return

  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return

  const isOpen = panel.getAttribute('data-state') === 'open'
  if (isOpen) return

  const trigger = document.querySelector('[data-tour-target="menu-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
    await waitForDom()
  }
}

const ensureMenuClosed = async () => {
  if (typeof document === 'undefined') return

  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return

  const isOpen = panel.getAttribute('data-state') === 'open'
  if (!isOpen) return

  const closeBtn = panel.querySelector('[data-tour-target="menu-close"]')
  if (closeBtn instanceof HTMLElement) {
    closeBtn.click()
    await waitForDom()
  }
}

const ensureAccordionExpanded = async () => {
  const content = document.querySelector('[data-tour-target="accordion-content"]')
  if (content?.getAttribute('data-state') === 'open') return

  const trigger = document.querySelector('[data-tour-target="accordion-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
    await waitForDom()
  }
}

// Flow using imperative hooks for menus and accordions
export const menuFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'menu-demo',
  version: { major: 1, minor: 0 },
  resumeStrategy: 'current',
  steps: [
    {
      id: 'menu-trigger',
      target: { selector: '[data-tour-target="menu-trigger"]' },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      onResume: ensureMenuClosed,
      content: <p>Click to open the navigation menu.</p>,
    },
    {
      id: 'menu-item',
      target: { selector: '[data-tour-target="menu-item-settings"]' },
      placement: 'right',
      advance: [{ type: 'manual' }],
      onEnter: ensureMenuOpen,
      onResume: ensureMenuOpen,
      onExit: ensureMenuClosed,
      content: <p>Here's where you access settings.</p>,
    },
    {
      id: 'accordion-section',
      target: { selector: '[data-tour-target="accordion-content"]' },
      placement: 'top',
      advance: [{ type: 'manual' }],
      onEnter: ensureAccordionExpanded,
      onResume: ensureAccordionExpanded,
      content: <p>Expand sections to see more options.</p>,
    },
    {
      id: 'below-fold-section',
      target: { selector: '[data-tour-target="footer-cta"]' },
      placement: 'top',
      targetBehavior: {
        scrollMargin: { top: 64 },
        scrollMode: 'start',
      },
      advance: [{ type: 'manual' }],
      onEnter: ensureMenuClosed,
      onResume: ensureMenuClosed,
      content: <p>Notice the scroll respects the sticky header.</p>,
    },
  ],
})

// ============================================================================
// PATTERN: Combine hooks for complex UI states
// ============================================================================

const setupComplexState = async () => {
  await ensureMenuOpen()
  await new Promise((r) => setTimeout(r, 100))
  await ensureAccordionExpanded()
}

export const complexStateStep = {
  id: 'complex-ui-state',
  target: { selector: '[data-tour-target="nested-item"]' },
  onEnter: setupComplexState,
  onResume: setupComplexState,
  onExit: ensureMenuClosed,
  content: <p>Multiple UI elements prepared for this step.</p>,
}

// Make SettingsDialog available for use
export { SettingsDialog }
