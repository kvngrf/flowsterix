/**
 * Lifecycle Hooks Example
 *
 * Demonstrates onEnter, onResume, and onExit for UI synchronization.
 */

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import {
  createRadixDialogHelpers,
  waitForDom,
} from '@flowsterix/react'
import type { ReactNode } from 'react'

// Helper functions to control menu state
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

// Use createRadixDialogHelpers for Radix dialogs
const settingsDialog = createRadixDialogHelpers({
  contentSelector: '[data-tour-target="dialog-content"]',
  triggerSelector: '[data-tour-target="dialog-trigger"]',
})

const ensureAccordionExpanded = async () => {
  const content = document.querySelector('[data-tour-target="accordion-content"]')
  if (content?.getAttribute('data-state') === 'open') return

  const trigger = document.querySelector('[data-tour-target="accordion-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
    await waitForDom()
  }
}

export const lifecycleFlow: FlowDefinition<ReactNode> = createFlow({
  id: 'lifecycle-demo',
  version: { major: 1, minor: 0 },
  resumeStrategy: 'current',
  steps: [
    // Menu interaction
    {
      id: 'menu-trigger',
      target: { selector: '[data-tour-target="menu-trigger"]' },
      placement: 'right',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      onResume: ensureMenuClosed, // Ensure menu is closed before showing this step
      content: <p>Click to open the navigation menu.</p>,
    },

    {
      id: 'menu-item',
      target: { selector: '[data-tour-target="menu-item-settings"]' },
      placement: 'right',
      advance: [{ type: 'manual' }],
      onEnter: ensureMenuOpen,
      onResume: ensureMenuOpen, // Also open when resuming!
      onExit: ensureMenuClosed,
      content: <p>Here's where you access settings.</p>,
    },

    // Dialog interaction - use createRadixDialogHelpers for clean async handling
    {
      id: 'dialog-trigger',
      target: { selector: '[data-tour-target="dialog-trigger"]' },
      placement: 'bottom',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: <p>Click to open the settings dialog.</p>,
    },

    {
      id: 'dialog-content',
      target: { selector: '[data-tour-target="dialog-content"]' },
      placement: 'right',
      advance: [{ type: 'manual' }],
      onEnter: settingsDialog.open,
      onResume: settingsDialog.open,
      onExit: settingsDialog.close,
      content: <p>Configure your preferences here.</p>,
    },

    // Accordion interaction
    {
      id: 'accordion-section',
      target: { selector: '[data-tour-target="accordion-content"]' },
      placement: 'top',
      advance: [{ type: 'manual' }],
      onEnter: ensureAccordionExpanded,
      onResume: ensureAccordionExpanded,
      content: <p>Expand sections to see more options.</p>,
    },

    // Scroll handling with sticky header
    {
      id: 'below-fold-section',
      target: { selector: '[data-tour-target="footer-cta"]' },
      placement: 'top',
      targetBehavior: {
        scrollMargin: { top: 64 }, // Offset for 64px sticky header
        scrollMode: 'start',
      },
      advance: [{ type: 'manual' }],
      onEnter: async () => {
        // Close any open overlays before scrolling
        await ensureMenuClosed()
        await settingsDialog.close()
      },
      onResume: async () => {
        await ensureMenuClosed()
        await settingsDialog.close()
      },
      content: <p>Notice the scroll respects the sticky header.</p>,
    },
  ],
})

// Pattern: Combine hooks for complex UI states
const setupComplexState = async () => {
  ensureMenuOpen()
  await new Promise((r) => setTimeout(r, 100))
  ensureAccordionExpanded()
  await new Promise((r) => setTimeout(r, 100))
}

const cleanupComplexState = () => {
  ensureMenuClosed()
}

export const complexStateStep = {
  id: 'complex-ui-state',
  target: { selector: '[data-tour-target="nested-item"]' },
  onEnter: setupComplexState,
  onResume: setupComplexState,
  onExit: cleanupComplexState,
  content: <p>Multiple UI elements prepared for this step.</p>,
}
