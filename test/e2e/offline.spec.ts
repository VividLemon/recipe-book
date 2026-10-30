import { expect, test } from '@nuxt/test-utils/playwright'
import type { Page, BrowserContext } from '@playwright/test'
import sharp from 'sharp'

/** Makes the page report `display-mode: standalone`, as the installed app does. */
const runAsInstalledApp = (page: Page) => page.addInitScript(() => {
  const matchMedia = window.matchMedia.bind(window)
  window.matchMedia = (query: string) => query === '(display-mode: standalone)'
    ? { ...matchMedia(query), matches: true, media: query }
    : matchMedia(query)
})

const registerWithRecipe = async (page: Page, context: BrowserContext, prefix: string) => {
  const suffix = `${Date.now()}`
  const registration = await page.request.post('/api/auth/register', {
    data: {
      username: `${prefix}-${suffix}`,
      email: `${prefix}-${suffix}@example.test`,
      password: `${prefix}-password-123`
    }
  })
  expect(registration.status()).toBe(201)
  // The session cookie is `Secure`, which the browser drops over plain http; copy it in
  const [cookieName = '', cookieValue = ''] = registration.headers()['set-cookie']
    ?.split(';', 1)[0]?.split('=') ?? []
  await context.addCookies([{ name: cookieName, value: cookieValue, url: page.url() }])

  const cover = await sharp({
    create: { width: 64, height: 64, channels: 3, background: '#00aa00' }
  }).png().toBuffer()
  const name = `Offline stew ${suffix}`
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
  return { suffix, name, username: `${prefix}-${suffix}`, recipe: await created.json() }
}

const deviceState = (page: Page) => page.evaluate(async () => {
  const cacheNames = await caches.keys()
  const recipes = await new Promise<number>((resolve) => {
    const open = indexedDB.open('recipe-book')
    open.onupgradeneeded = () => open.transaction?.abort()
    open.onerror = () => resolve(0)
    open.onsuccess = () => {
      const db = open.result
      if (!db.objectStoreNames.contains('recipes')) return resolve(0)
      const count = db.transaction('recipes').objectStore('recipes').count()
      count.onsuccess = () => resolve(count.result)
    }
  })
  return {
    serviceWorkers: (await navigator.serviceWorker.getRegistrations()).length,
    photos: cacheNames.includes('recipe-photos'),
    recipes
  }
})

test('a browser tab keeps nothing for offline use', async ({ page, context, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  const { name } = await registerWithRecipe(page, context, 'tab')
  await page.reload()
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()

  expect(await deviceState(page)).toEqual({ serviceWorkers: 0, photos: false, recipes: 0 })

  await context.setOffline(true)
  await expect(page.getByText('Install the app to keep your recipes available offline')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Recipe' })).toHaveClass(/disabled/)
  await context.setOffline(false)
})

test('the installed app shows own recipes and photos offline and wipes them on logout', async ({ page, context, goto }) => {
  await runAsInstalledApp(page)
  await goto('/', { waitUntil: 'hydration' })
  const { suffix, name, username, recipe } = await registerWithRecipe(page, context, 'app')
  const fullSizeCover = new URL(recipe.photos.coverImage.default.avif, page.url()).href

  await page.reload()
  await page.evaluate(() => navigator.serviceWorker.ready)
  // The sync downloads full-size covers that the list never displays
  await expect.poll(() => page.evaluate(async (url) =>
    !!(await (await caches.open('recipe-photos')).match(url)), fullSizeCover), { timeout: 15_000 }).toBe(true)

  // Offline, the worker serves the data-free shell and the app reads the device copy
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Showing saved recipes')).toBeVisible()
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()
  const cardImage = page.locator('.card img').first()
  await expect.poll(() => cardImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)

  // A filter never requested online is answered from the device too
  await page.getByLabel('Filter by Name:').fill(suffix)
  await expect(page).toHaveURL(new RegExp(`name=${suffix}`))
  await expect(page.getByRole('heading', { name }).first()).toBeVisible()

  await page.getByRole('button', { name: 'View' }).first().click()
  const modalImage = page.locator('.modal img').first()
  await expect.poll(() => modalImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await context.setOffline(false)

  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(username) }).click()
  await page.getByText('Logout').click()
  await expect(page).toHaveURL(/\/login/)
  expect(await deviceState(page)).toMatchObject({ photos: false, recipes: 0 })
})
