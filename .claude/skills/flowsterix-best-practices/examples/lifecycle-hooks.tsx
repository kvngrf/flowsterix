/**
 * Lifecycle Hooks Example
 *
 * Demonstrates onEnter, onResume, and onExit for UI synchronization.
 */

import { createFlow, type FlowDefinition } from '@flowsterix/core'
import type { ReactNode } from 'react'

// Helper functions to control UI state
const ensureMenuOpen = () => {
  if (typeof document === 'undefined') return

  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return

  const isOpen = panel.getAttribute('data-state') === 'open'
  if (isOpen) return

  const trigger = document.querySelector('[data-tour-target="menu-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
  }
}

const ensureMenuClosed = () => {
  if (typeof document === 'undefined') return

  const panel = document.querySelector('[data-tour-target="menu-panel"]')
  if (!(panel instanceof HTMLElement)) return

  const isOpen = panel.getAttribute('data-state') === 'open'
  if (!isOpen) return

  const closeBtn = panel.querySelector('[data-tour-target="menu-close"]')
  if (closeBtn instanceof HTMLElement) {
    closeBtn.click()
  }
}

const ensureDialogOpen = async () => {
  if (typeof document === 'undefined') return

  // Wait for DOM to settle
  await new Promise((r) => requestAnimationFrame(r))

  const dialog = document.querySelector('[data-tour-target="dialog-content"]')
  if (dialog) return // Already open

  const trigger = document.querySelector('[data-tour-target="dialog-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
    // Wait for dialog animation
    await new Promise((r) => setTimeout(r, 200))
  }
}

const ensureDialogClosed = () => {
  const closeBtn = document.querySelector('[data-tour-target="dialog-close"]')
  if (closeBtn instanceof HTMLElement) {
    closeBtn.click()
  }
}

const ensureAccordionExpanded = () => {
  const content = document.querySelector('[data-tour-target="accordion-content"]')
  if (content?.getAttribute('data-state') === 'open') return

  const trigger = document.querySelector('[data-tour-target="accordion-trigger"]')
  if (trigger instanceof HTMLElement) {
    trigger.click()
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

    // Dialog interaction
    {
      id: 'dialog-trigger',
      target: { selector: '[data-tour-target="dialog-trigger"]' },
      placement: 'bottom',
      advance: [{ type: 'event', event: 'click', on: 'target' }],
      content: <p>Click to open the settings dialog.</p>,
    },

    {
      id: 'dialog-content',
      target: { selector: '[data-tour-target="dialog-panel"]' },
      placement: 'right',
      advance: [{ type: 'manual' }],
      onEnter: ensureDialogOpen,
      onResume: ensureDialogOpen,
      onExit: ensureDialogClosed,
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
      onEnter: () => {
        // Close any open overlays before scrolling
        ensureMenuClosed()
        ensureDialogClosed()
      },
      onResume: () => {
        ensureMenuClosed()
        ensureDialogClosed()
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
