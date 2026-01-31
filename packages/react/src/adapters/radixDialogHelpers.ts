/**
 * Helper utilities for programmatically controlling Radix Dialog components
 * in tour lifecycle hooks (onEnter, onResume, onExit).
 */

/**
 * Wait for next animation frame + microtask flush.
 * Use this to ensure DOM updates have completed after triggering UI changes.
 */
export const waitForDom = (): Promise<void> =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  )

export interface CreateRadixDialogHelpersParams {
  /** Selector for the dialog content element (visible when open) */
  contentSelector: string
  /** Selector for the trigger button that opens the dialog */
  triggerSelector: string
}

export interface RadixDialogHelpers {
  /** Check if the dialog is currently open */
  isOpen: () => boolean
  /** Open the dialog if not already open */
  open: () => Promise<void>
  /** Close the dialog if currently open */
  close: () => Promise<void>
}

/**
 * Create helpers for programmatically controlling a Radix Dialog.
 *
 * @example
 * ```tsx
 * const settingsDialog = createRadixDialogHelpers({
 *   contentSelector: '[data-tour-target="settings-dialog"]',
 *   triggerSelector: '[data-tour-target="settings-trigger"]',
 * })
 *
 * // In flow step:
 * {
 *   id: 'settings-panel',
 *   target: { selector: '[data-tour-target="settings-dialog"]' },
 *   onEnter: settingsDialog.open,
 *   onResume: settingsDialog.open,
 *   onExit: settingsDialog.close,
 *   content: <p>Configure your settings here</p>,
 * }
 * ```
 */
export const createRadixDialogHelpers = (
  params: CreateRadixDialogHelpersParams,
): RadixDialogHelpers => {
  const { contentSelector, triggerSelector } = params

  const isOpen = (): boolean => {
    if (typeof document === 'undefined') return false
    return document.querySelector(contentSelector) !== null
  }

  const open = async (): Promise<void> => {
    if (typeof document === 'undefined') return
    if (isOpen()) return

    // Wait for any in-flight UI updates to complete
    await waitForDom()
    if (isOpen()) return

    const trigger = document.querySelector<HTMLButtonElement>(triggerSelector)
    trigger?.click()
    await waitForDom()
  }

  const close = async (): Promise<void> => {
    if (typeof document === 'undefined') return
    if (!isOpen()) return

    // Dispatch Escape keydown to close Radix dialog cleanly
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await waitForDom()
  }

  return { isOpen, open, close }
}
