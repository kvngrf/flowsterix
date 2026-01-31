/**
 * Wait for next animation frame + microtask flush.
 * Use this to ensure DOM updates have completed after triggering UI changes.
 */
export const waitForDom = (): Promise<void> =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  )
