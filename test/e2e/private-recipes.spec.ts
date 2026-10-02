import { expect, test } from '@playwright/test'
import sharp from 'sharp'

const recipeBody = (isPublic: boolean, stepsImages: string[] = []) => ({
  name: 'Access control test recipe',
  ingredients: [{ name: 'Salt', quantity: 1, unit: 'units' }],
  steps: 'Add salt.',
  difficulty: 'Easy',
  time: 1,
  tags: [],
  isPublic,
  stepsImages
})

test('private recipes and their photos are visible only to their owner', async ({ page }) => {
  await page.goto('/')
  const api = (path: string) => new URL(path, page.url()).toString()
  const suffix = `${Date.now()}`
  const owner = {
    username: `owner-${suffix}`,
    email: `owner-${suffix}@example.test`,
    password: 'owner-password-123'
  }
  const guest = {
    username: `guest-${suffix}`,
    email: `guest-${suffix}@example.test`,
    password: 'guest-password-123'
  }
  const registration = await page.request.post(api('/api/auth/register'), { data: owner })
  expect(registration.status()).toBe(201)

  const image = await sharp({
    create: { width: 1, height: 1, channels: 3, background: '#ffffff' }
  }).png().toBuffer()
  const photoResponse = await page.request.post(api('/api/recipes/photos/add-orphaned-image'), {
    multipart: {
      file_file: { name: 'private.png', mimeType: 'image/png', buffer: image }
    }
  })
  expect(photoResponse.status()).toBe(201)
  const photoUrl = (await photoResponse.json()).url as string

  const created = await page.request.post(api('/api/recipes'), {
    multipart: { body: JSON.stringify(recipeBody(false, [photoUrl])) }
  })
  expect(created.status()).toBe(201)
  const recipe = await created.json()
  expect(recipe.isPublic).toBe(false)
  expect((await page.request.get(api(photoUrl))).status()).toBe(200)

  const guestRegistration = await page.request.post(api('/api/auth/register'), { data: guest })
  expect(guestRegistration.status()).toBe(201)
  expect(await (await page.request.get(`/api/recipes/${recipe.id}`)).json()).toBeNull()
  expect((await page.request.get(api(photoUrl))).status()).toBe(404)
  expect((await page.request.put(api(`/api/recipes/${recipe.id}`), {
    multipart: { body: JSON.stringify(recipeBody(true)) }
  })).status()).toBe(404)

  await page.request.post(api('/api/auth/login'), { data: owner })
  expect((await page.request.put(api(`/api/recipes/${recipe.id}`), {
    multipart: { body: JSON.stringify(recipeBody(true)) }
  })).status()).toBe(204)

  await page.request.post(api('/api/auth/login'), { data: guest })
  expect((await page.request.get(api(`/api/recipes/${recipe.id}`))).status()).toBe(200)
  const favorite = await page.request.put(api('/api/user/favorites'), {
    data: { recipeId: recipe.id, favorite: true }
  })
  expect(favorite.status()).toBe(200)
  expect(await favorite.json()).toContain(recipe.id)
  const sorted = await page.request.get(api('/api/recipes?sort=favorite&order=asc&page=1&pageSize=1'))
  expect((await sorted.json()).items[0].id).toBe(recipe.id)
})
