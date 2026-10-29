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

  // A filter never requested online is answered from the device copy
  await page.getByLabel('Filter by Name:').fill(suffix)
  await expect(page).toHaveURL(new RegExp(`name=${suffix}`))
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()

  await context.setOffline(false)
})

test('own recipes sync with full-size photos and are wiped on logout', async ({ page, context, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  const suffix = `${Date.now()}`
  const registration = await page.request.post('/api/auth/register', {
    data: {
      username: `sync-${suffix}`,
      email: `sync-${suffix}@example.test`,
      password: 'sync-password-123'
    }
  })
  expect(registration.status()).toBe(201)
  const [cookieName = '', cookieValue = ''] = registration.headers()['set-cookie']
    ?.split(';', 1)[0]?.split('=') ?? []
  await context.addCookies([{ name: cookieName, value: cookieValue, url: page.url() }])

  const cover = await sharp({
    create: { width: 64, height: 64, channels: 3, background: '#00ff00' }
  }).png().toBuffer()
  const name = `Synced stew ${suffix}`
  const created = await page.request.post('/api/recipes', {
    multipart: {
      body: JSON.stringify({
        name,
        ingredients: [{ name: 'Beans', quantity: 1, unit: 'can' }],
        steps: 'Simmer.',
        difficulty: 'Easy',
        time: 30,
        tags: [],
        isPublic: false
      }),
      file_coverImage: { name: 'cover.png', mimeType: 'image/png', buffer: cover }
    }
  })
  expect(created.status()).toBe(201)
  const recipe = await created.json()
  const fullSizeCover = new URL(recipe.photos.coverImage.default.avif, page.url()).href

  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  // The sync downloads full-size covers that the list never displays
  await expect.poll(() => page.evaluate(async (url) =>
    !!(await (await caches.open('recipe-photos')).match(url)), fullSizeCover)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'View' }).first().click()
  const modalImage = page.locator('.modal img').first()
  await expect.poll(() => modalImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'Edit Recipe' })).toBeDisabled()
  await context.setOffline(false)

  await page.reload()
  await page.getByRole('button', { name: new RegExp(`sync-${suffix}`) }).click()
  await page.getByText('Logout').click()
  await expect(page).toHaveURL(/\/login/)
  const leftovers = await page.evaluate(async () => {
    const names = await caches.keys()
    const recipes = await new Promise<number>((resolve) => {
      const open = indexedDB.open('recipe-book')
      open.onsuccess = () => {
        const count = open.result.transaction('recipes').objectStore('recipes').count()
        count.onsuccess = () => resolve(count.result)
      }
    })
    return { photos: names.includes('recipe-photos'), pages: names.includes('pages'), recipes }
  })
  expect(leftovers).toEqual({ photos: false, pages: false, recipes: 0 })
})
