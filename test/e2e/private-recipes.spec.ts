import { expect, test } from '@nuxt/test-utils/playwright'
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

test('private recipes and their photos are visible only to their owner', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  const api = (path: string) => new URL(path, page.url()).toString()
  let sessionCookie = ''
  const request = (path: string, options: Parameters<typeof page.request.fetch>[1] = {}) => page.request.fetch(api(path), {
    ...options,
    headers: {
      ...options.headers,
      ...(sessionCookie ? { cookie: sessionCookie } : {})
    }
  })
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
  const registration = await request('/api/auth/register', { method: 'POST', data: owner })
  expect(registration.status()).toBe(201)
  sessionCookie = registration.headers()['set-cookie']?.split(';', 1)[0] ?? ''

  const image = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#ffffff' }
  }).png().toBuffer()
  const photoResponse = await request('/api/recipes/photos/add-orphaned-image', {
    method: 'POST',
    multipart: {
      file_file: { name: 'private.png', mimeType: 'image/png', buffer: image }
    }
  })
  console.log(await photoResponse.text())
  expect(photoResponse.status()).toBe(201)
  const photoUrl = (await photoResponse.json()).url as string

  const created = await request('/api/recipes', {
    method: 'POST',
    multipart: { body: JSON.stringify(recipeBody(false, [photoUrl])) }
  })
  expect(created.status()).toBe(201)
  const recipe = await created.json()
  expect(recipe.isPublic).toBe(false)
  expect((await request(photoUrl)).status()).toBe(200)

  const guestRegistration = await request('/api/auth/register', { method: 'POST', data: guest })
  expect(guestRegistration.status()).toBe(201)
  sessionCookie = guestRegistration.headers()['set-cookie']?.split(';', 1)[0] ?? ''
  expect(await (await request(`/api/recipes/${recipe.id}`)).json()).toBeNull()
  expect((await request(photoUrl)).status()).toBe(404)
  expect((await request(`/api/recipes/${recipe.id}`, {
    method: 'PUT',
    multipart: { body: JSON.stringify(recipeBody(true)) }
  })).status()).toBe(404)

  const ownerLogin = await request('/api/auth/login', { method: 'POST', data: owner })
  sessionCookie = ownerLogin.headers()['set-cookie']?.split(';', 1)[0] ?? ''
  expect((await request(`/api/recipes/${recipe.id}`, {
    method: 'PUT',
    multipart: { body: JSON.stringify(recipeBody(true)) }
  })).status()).toBe(204)

  const guestLogin = await request('/api/auth/login', { method: 'POST', data: guest })
  sessionCookie = guestLogin.headers()['set-cookie']?.split(';', 1)[0] ?? ''
  expect((await request(`/api/recipes/${recipe.id}`)).status()).toBe(200)
  const favorite = await request('/api/user/favorites', {
    method: 'PUT',
    data: { recipeId: recipe.id, favorite: true }
  })
  expect(favorite.status()).toBe(200)
  expect(await favorite.json()).toContain(recipe.id)
  const sorted = await request('/api/recipes?sort=favorite&order=asc&page=1&pageSize=1')
  expect((await sorted.json()).items[0].id).toBe(recipe.id)
})
