import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('application navigation', () => {
  test('loads the application shell', async ({ page, goto }) => {
    await goto('/', { waitUntil: 'hydration' })
    await expect(page.locator('body')).toBeVisible()
  })
})
