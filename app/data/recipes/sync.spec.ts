import { describe, expect, it, vi } from 'vitest'
import { syncOwnRecipes } from './sync'
import { recipePhotoUrls } from './photos'
import type { RecipePageResponse, RecipeWeb } from '../../../types/recipe'

const variants = (name: string) => ({ original: `/api/photos/${name}.png`, webp: `/api/photos/${name}.webp`, avif: `/api/photos/${name}.avif` })
const recipe = (id: string, photos?: RecipeWeb['photos']): RecipeWeb => ({
  id, ownerId: 'me', createdAt: 1, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1, photos
})

describe('recipePhotoUrls', () => {
  it('collects both cover sizes in one format plus step images, without duplicates', () => {
    const urls = recipePhotoUrls([
      recipe('a', { coverImage: { default: variants('a'), thumbnail: variants('a-thumb') }, stepsImages: ['/api/photos/step.png'] }),
      recipe('b', { stepsImages: ['/api/photos/step.png'] }),
      recipe('c')
    ], 'avif')
    expect(urls).toEqual(['/api/photos/a.avif', '/api/photos/a-thumb.avif', '/api/photos/step.png'])
  })
})

describe('syncOwnRecipes', () => {
  it('pages through the user\'s own recipes and replaces the device copy', async () => {
    const pages: Record<number, RecipePageResponse> = {
      1: { items: [recipe('a')], total: 2, page: 1, pageSize: 100, nextPage: 2 },
      2: { items: [recipe('b', { stepsImages: ['/api/photos/s.png'] })], total: 2, page: 2, pageSize: 100, nextPage: null }
    }
    const fetch = vi.fn(async (url: string, options?: { query?: Record<string, unknown> }) =>
      url === '/api/recipes' ? pages[options!.query!.page as number] : [{ id: 't', createdAt: 1, text: 'T' }]
    ) as never
    const store = { replaceAll: vi.fn(async () => {}), markSynced: vi.fn(async () => {}) }
    const syncPhotos = vi.fn(async () => 0)
    const signal = new AbortController().signal

    const count = await syncOwnRecipes('me', { fetch, store, syncPhotos, imageFormat: 'webp', signal, now: () => 42 })

    expect(count).toBe(2)
    expect(fetch).toHaveBeenCalledWith('/api/recipes', { query: { mine: true, page: 1, pageSize: 100 }, signal })
    expect(store.replaceAll).toHaveBeenCalledWith({
      recipes: [recipe('a'), recipe('b', { stepsImages: ['/api/photos/s.png'] })],
      tags: [{ id: 't', createdAt: 1, text: 'T' }],
      meta: { userId: 'me', lastSyncedAt: 0 }
    })
    expect(syncPhotos).toHaveBeenCalledWith(['/api/photos/s.png'], signal)
    expect(store.markSynced).toHaveBeenCalledWith('me', 42)
  })

  it('leaves the device copy alone when the download fails', async () => {
    const store = { replaceAll: vi.fn(async () => {}), markSynced: vi.fn(async () => {}) }
    const fetch = vi.fn(async () => { throw new Error('offline') }) as never
    const signal = new AbortController().signal
    await expect(syncOwnRecipes('me', { fetch, store, syncPhotos: vi.fn(async () => 0), imageFormat: 'avif', signal })).rejects.toThrow('offline')
    expect(store.replaceAll).not.toHaveBeenCalled()
  })

  it('writes nothing once the user changed during the download', async () => {
    const controller = new AbortController()
    const store = { replaceAll: vi.fn(async () => {}), markSynced: vi.fn(async () => {}) }
    const fetch = vi.fn(async (url: string) => {
      if (url === '/api/recipe-tags') controller.abort()
      return url === '/api/recipes' ? { items: [], total: 0, page: 1, pageSize: 100, nextPage: null } : []
    }) as never
    await expect(syncOwnRecipes('me', { fetch, store, syncPhotos: vi.fn(async () => 0), imageFormat: 'avif', signal: controller.signal }))
      .rejects.toThrow()
    expect(store.replaceAll).not.toHaveBeenCalled()
  })

  it('does not mark the sync complete while photos are missing', async () => {
    const store = { replaceAll: vi.fn(async () => {}), markSynced: vi.fn(async () => {}) }
    const fetch = vi.fn(async (url: string) =>
      url === '/api/recipes' ? { items: [], total: 0, page: 1, pageSize: 100, nextPage: null } : []) as never
    await syncOwnRecipes('me', { fetch, store, syncPhotos: vi.fn(async () => 2), imageFormat: 'avif', signal: new AbortController().signal })
    expect(store.replaceAll).toHaveBeenCalled()
    expect(store.markSynced).not.toHaveBeenCalled()
  })
})
