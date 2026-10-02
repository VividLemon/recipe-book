import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, type Pinia } from 'pinia'
import { effectScope } from 'vue'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { PiniaColada, setInfiniteQueryData, useQueryCache } from '@pinia/colada'
import { useRecipeMutations } from './useRecipeMutations'
import { recipeKeys } from '~/queries/recipes'
import type { RecipePages } from '~/queries/recipeCache'
import type { RecipeWeb } from '../../types/recipe'

const recipe = (id: string, name = id): RecipeWeb => ({
  id, createdAt: 1, updatedAt: 1, name, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1
})
const listKey = recipeKeys.list({ page: 1, pageSize: 12 })

describe('useRecipeMutations', () => {
  let cache: ReturnType<typeof useQueryCache>
  let mutations: ReturnType<typeof useRecipeMutations>
  let handler: () => Promise<unknown> = async () => ({})
  registerEndpoint('/api/recipes', { method: 'POST', handler: () => handler() })
  registerEndpoint('/api/recipes/a', { method: 'PUT', handler: () => handler() })
  registerEndpoint('/api/recipes/a', { method: 'DELETE', handler: () => handler() })
  const failure = () => {
    let fail!: () => void
    handler = () => new Promise((_, r) => { fail = () => r(createError({ statusCode: 500, statusMessage: 'boom' })) })
    return () => fail()
  }
  const listData = () => cache.getQueryData<RecipePages>(listKey)

  beforeEach(() => {
    handler = async () => ({})
    const pinia = useNuxtApp().$pinia as Pinia
    setActivePinia(pinia)
    cache = useQueryCache(pinia)
    setInfiniteQueryData(cache, listKey, {
      pageParams: [1],
      pages: [{ items: [recipe('a'), recipe('b')], total: 2, page: 1, pageSize: 12, nextPage: null }]
    })
    cache.setQueryData(recipeKeys.detail('a'), recipe('a'))
    mutations = effectScope().run(() => useRecipeMutations())!
  })

  it('optimistically updates list and detail, then rolls back on failure', async () => {
    const fail = failure()
    const pending = mutations.update.mutateAsync({
      id: 'a', body: new FormData(), optimistic: recipe('a', 'renamed')
    })
    await vi.waitFor(() => expect(listData()!.pages[0]!.items[0]!.name).toBe('renamed'))
    expect(cache.getQueryData<RecipeWeb>(recipeKeys.detail('a'))!.name).toBe('renamed')
    fail()
    await expect(pending).rejects.toThrow()
    expect(listData()!.pages[0]!.items[0]!.name).toBe('a')
    expect(cache.getQueryData<RecipeWeb>(recipeKeys.detail('a'))!.name).toBe('a')
  })

  it('optimistically removes on delete and restores on failure', async () => {
    handler = async () => { throw createError({ statusCode: 500 }) }
    await expect(mutations.remove.mutateAsync({ id: 'a' })).rejects.toThrow()
    expect(listData()!.pages[0]!.items.map((el) => el.id)).toEqual(['a', 'b'])
  })

  it('removes from cache while the delete is in flight and keeps it on success', async () => {
    let resolve!: () => void
    handler = () => new Promise((r) => { resolve = () => r({}) })
    const pending = mutations.remove.mutateAsync({ id: 'a' })
    await vi.waitFor(() => expect(listData()!.pages[0]!.items.map((el) => el.id)).toEqual(['b']))
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'))
    resolve()
    await pending
  })

  it('appends a created recipe optimistically and rolls back on failure', async () => {
    const fail = failure()
    const pending = mutations.create.mutateAsync({ body: new FormData(), optimistic: recipe('new') })
    await vi.waitFor(() => expect(listData()!.pages[0]!.items.map((el) => el.id)).toEqual(['a', 'b', 'new']))
    fail()
    await expect(pending).rejects.toThrow()
    expect(listData()!.pages[0]!.items.map((el) => el.id)).toEqual(['a', 'b'])
  })
})
