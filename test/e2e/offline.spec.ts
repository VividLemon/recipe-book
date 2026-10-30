import { expect, test } from '@nuxt/test-utils/playwright'
import sharp from 'sharp'

test('recipes and their photos stay viewable offline after a visit', async ({ page, context, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  const suffix = `${Date.now()}`
  const registration = await page.request.post('/api/auth/register', {
    data: {
      username: `offline-${suffix}`,
      email: `offline-${suffix}@example.test`,
      password: 'offline-password-123'
    }
  })
  expect(registration.status()).toBe(201)
  // The session cookie is `Secure`, which the browser drops over plain http; copy it in
  const [cookieName = '', cookieValue = ''] = registration.headers()['set-cookie']
    ?.split(';', 1)[0]?.split('=') ?? []
  await context.addCookies([{ name: cookieName, value: cookieValue, url: page.url() }])

  const cover = await sharp({
    create: { width: 32, height: 32, channels: 3, background: '#ff0000' }
  }).png().toBuffer()
  const name = `Offline soup ${suffix}`
  const created = await page.request.post('/api/recipes', {
    multipart: {
      body: JSON.stringify({
        name,
        ingredients: [{ name: 'Water', quantity: 1, unit: 'cup' }],
        steps: 'Boil.',
        difficulty: 'Easy',
        time: 5,
        tags: [],
        isPublic: false
      }),
      file_coverImage: { name: 'cover.png', mimeType: 'image/png', buffer: cover }
    }
  })
  expect(created.status()).toBe(201)

  // Load once while controlled by the service worker so runtime caches fill
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()
  const cardImage = page.locator('.card img').first()
  await expect(cardImage).toHaveJSProperty('complete', true)

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByText("You're offline")).toBeVisible()
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()
  await expect.poll(() => cardImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByRole('link', { name: 'Create Recipe' })).toHaveClass(/disabled/)

  await context.setOffline(false)
})
