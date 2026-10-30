import { describe, expect, it, vi } from 'vitest'
import { isNetworkError, withOfflineFallback } from './withOfflineFallback'
import type { RecipeSource } from './types'
import type { RecipePageResponse, RecipeWeb } from '../../../types/recipe'

const recipe = (id: string, ownerId: string): RecipeWeb => ({
  id, ownerId, createdAt: 1, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1
})
const page = (items: RecipeWeb[]): RecipePageResponse => ({ items, total: items.length, page: 1, pageSize: 12, nextPage: null })

const fetchError = (statusCode?: number) =>
  Object.assign(new Error('fetch failed'), { name: 'FetchError', statusCode })

const source = (overrides: Partial<RecipeSource> = {}): RecipeSource => ({
  listPage: vi.fn(async () => page([])),
  get: vi.fn(async () => null),
  listTags: vi.fn(async () => []),
  ...overrides
})

const setup = (remote: RecipeSource, user: { id: string | null } = { id: 'me' }) => {
  const local = source({ listPage: vi.fn(async () => page([recipe('offline', 'me')])) })
  const store = { putRecipes: vi.fn(async () => {}), replaceTags: vi.fn(async () => {}) }
  const decorated = withOfflineFallback(remote, local, store, { userId: () => user.id })
  return { local, store, decorated }
}

describe('isNetworkError', () => {
  it('treats missing responses and gateway errors as network errors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkError(fetchError())).toBe(true)
    expect(isNetworkError(fetchError(504))).toBe(true)
  })

  it('treats real server answers and other errors as failures', () => {
    expect(isNetworkError(fetchError(401))).toBe(false)
    expect(isNetworkError(fetchError(500))).toBe(false)
    expect(isNetworkError(new Error('bug'))).toBe(false)
  })
})

describe('withOfflineFallback', () => {
  it('returns remote results and stores only kept recipes', async () => {
    const mine = recipe('mine', 'me')
    const { decorated, store, local } = setup(source({
      listPage: vi.fn(async () => page([mine, recipe('theirs', 'someone')]))
    }))
    expect((await decorated.listPage({})).items).toHaveLength(2)
    expect(store.putRecipes).toHaveBeenCalledWith([mine], 'me')
    expect(local.listPage).not.toHaveBeenCalled()
  })

  it('answers from the device when the network fails', async () => {
    const { decorated, store } = setup(source({
      listPage: vi.fn(async () => { throw fetchError() })
    }))
    expect((await decorated.listPage({})).items.map((el) => el.id)).toEqual(['offline'])
    expect(store.putRecipes).not.toHaveBeenCalled()
  })

  it('rethrows real server errors', async () => {
    const { decorated, local } = setup(source({
      get: vi.fn(async () => { throw fetchError(401) })
    }))
    await expect(decorated.get('x')).rejects.toThrow('fetch failed')
    expect(local.get).not.toHaveBeenCalled()
  })

  it('does not fail when the device store does', async () => {
    const { decorated, store } = setup(source({ listTags: vi.fn(async () => [{ id: 't', createdAt: 1, text: 'T' }]) }))
    store.replaceTags.mockRejectedValueOnce(new Error('quota'))
    expect(await decorated.listTags()).toHaveLength(1)
  })

  it('neither saves nor falls back for a cancelled request', async () => {
    const controller = new AbortController()
    const { decorated, store, local } = setup(source({
      listPage: vi.fn(async () => {
        controller.abort()
        return page([recipe('deleted-meanwhile', 'me')])
      }),
      get: vi.fn(async () => {
        throw fetchError()
      })
    }))
    await decorated.listPage({}, { signal: controller.signal })
    expect(store.putRecipes).not.toHaveBeenCalled()
    await expect(decorated.get('x', { signal: controller.signal })).rejects.toThrow('fetch failed')
    expect(local.get).not.toHaveBeenCalled()
  })

  it('saves nothing when the user signed out during the request', async () => {
    const user = { id: 'me' as string | null }
    const { decorated, store } = setup(source({
      listPage: vi.fn(async () => {
        user.id = null
        return page([recipe('mine', 'me')])
      })
    }), user)
    await decorated.listPage({})
    expect(store.putRecipes).not.toHaveBeenCalled()
  })
})
