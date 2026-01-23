import { test, expect } from '@playwright/test'

const FLOW_STORAGE_KEY = 'flowsterix:demo-onboarding'

test.describe('Tour Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear tour state before each test
    await page.addInitScript((key) => {
      localStorage.removeItem(key)
    }, FLOW_STORAGE_KEY)
  })

  test('auto-starts and shows welcome step', async ({ page }) => {
    await page.goto('/')

    // Tour should auto-start and show the welcome popover
    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Check welcome content is displayed
    await expect(popover.getByText('Welcome to Flowsterix')).toBeVisible()
  })

  test('hold-to-skip button cancels tour', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Skip button requires holding for ~5 seconds
    const skipButton = page.getByRole('button', { name: /skip/i })
    await expect(skipButton).toBeVisible()

    // Hold the button down for 5.5 seconds
    await skipButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(5500)
    await skipButton.dispatchEvent('pointerup')

    // Popover should disappear after hold completes
    await expect(popover).not.toBeVisible({ timeout: 3000 })
  })

  test('next button advances to next step', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Verify we're on welcome step
    await expect(popover.getByText('Welcome to Flowsterix')).toBeVisible()

    // Click next
    const nextButton = page.locator('[data-tour-button="next"]')
    await nextButton.click()

    // Should advance to menu step (use first() since there may be duplicates)
    await expect(
      popover.getByRole('heading', { name: 'Navigation Drawer' }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('back button returns to previous step', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Go to second step
    await page.locator('[data-tour-button="next"]').click()
    await expect(
      popover.getByRole('heading', { name: 'Navigation Drawer' }).first()
    ).toBeVisible({ timeout: 5000 })

    // Go back
    const backButton = page.locator('[data-tour-button="back"]')
    await backButton.click()

    // Should be back on welcome
    await expect(
      popover.getByRole('heading', { name: 'Welcome to Flowsterix' }).first()
    ).toBeVisible()
  })
})

test.describe('Tour Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key)
    }, FLOW_STORAGE_KEY)
  })

  test('resumes at same step after page refresh', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Advance to second step
    await page.locator('[data-tour-button="next"]').click()
    await expect(
      popover.getByRole('heading', { name: 'Navigation Drawer' }).first()
    ).toBeVisible({ timeout: 5000 })

    // Refresh the page
    await page.reload()

    // Should resume at the same step (Navigation Drawer)
    await expect(popover).toBeVisible({ timeout: 10000 })
    await expect(
      popover.getByRole('heading', { name: 'Navigation Drawer' }).first()
    ).toBeVisible()
  })

  test('does not restart after tour is completed', async ({ page }) => {
    // Simulate a completed tour state
    await page.addInitScript((key) => {
      const completedState = {
        version: '1.0',
        value: { status: 'completed', stepIndex: 9 },
        updatedAt: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(completedState))
    }, FLOW_STORAGE_KEY)

    await page.goto('/')

    // Tour should not show
    const popover = page.locator('[data-tour-popover]')
    await expect(popover).not.toBeVisible({ timeout: 3000 })
  })

  test('does not restart after tour is cancelled', async ({ page }) => {
    // Simulate a cancelled tour state
    await page.addInitScript((key) => {
      const cancelledState = {
        version: '1.0',
        value: { status: 'cancelled', stepIndex: 0 },
        updatedAt: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(cancelledState))
    }, FLOW_STORAGE_KEY)

    await page.goto('/')

    // Tour should not show
    const popover = page.locator('[data-tour-popover]')
    await expect(popover).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Tour UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key)
    }, FLOW_STORAGE_KEY)
  })

  test('shows tour controls', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Check for navigation buttons
    const nextButton = page.locator('[data-tour-button="next"]')
    const skipButton = page.locator('[data-tour-button="skip"]')

    await expect(nextButton).toBeVisible()
    await expect(skipButton).toBeVisible()
  })

  test('popover has accessible dialog role', async ({ page }) => {
    await page.goto('/')

    // Check that popover has dialog role
    const dialog = page.locator('[data-tour-popover][role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 10000 })
  })

  test('target element is highlighted', async ({ page }) => {
    await page.goto('/')

    const popover = page.locator('[data-tour-popover]')
    await expect(popover).toBeVisible({ timeout: 10000 })

    // Advance to step with element target (menu button)
    await page.locator('[data-tour-button="next"]').click()

    // Wait for step transition
    await expect(
      popover.getByRole('heading', { name: 'Navigation Drawer' }).first()
    ).toBeVisible({ timeout: 5000 })

    // Check that highlight overlay exists (the SVG mask creates the spotlight)
    const overlay = page.locator('[data-tour-overlay]')
    await expect(overlay).toBeVisible()
  })
})
