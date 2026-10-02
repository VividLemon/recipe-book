import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQueryCache } from '@pinia/colada'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReadRecipePageResponse, RecipeWeb } from '../../types/recipe'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

const makeRecipe = (id: string): RecipeWeb => ({
  id,
  createdAt: 1,
  updatedAt: 1,
  name: 'Soup',
  ingredients: [],
  tags: [],
  steps: 'Boil',
  difficulty: 'Easy',
  time: 10
})

const pageData = (
  items: RecipeWeb[] = []
): { pages: ReadRecipePageResponse[]; pageParams: number[] } => ({
  pages: [{
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
    nextPage: null
  }],
  pageParams: [1]
})

describe('useRecipeMutations', () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.restoreAllMocks()
  })

  it('replaces an optimistic create in cached recipe pages with the server recipe', async () => {
    fetchMock.mockResolvedValue(makeRecipe('server-id'))
    let cache!: ReturnType<typeof useQueryCache>
    let mutations!: ReturnType<typeof useRecipeMutations>
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        cache = useQueryCache()
        mutations = useRecipeMutations()
        return () => h('div')
      }
    }))
    const key = ['recipes', '', '', '', '', 'asc', 20]
    cache.setQueryData(key, pageData())

    await mutations.create.mutateAsync({
      body: new FormData(),
      optimisticRecipe: makeRecipe('temporary-id')
    })

    expect(cache.getQueryData<{ pages: ReadRecipePageResponse[] }>(key)
      ?.pages[0]?.items).toEqual([makeRecipe('server-id')])
    wrapper.unmount()
  })

  it('restores the previous cached list when a create fails', async () => {
    fetchMock.mockRejectedValue(new Error('failed'))
    let cache!: ReturnType<typeof useQueryCache>
    let mutations!: ReturnType<typeof useRecipeMutations>
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        cache = useQueryCache()
        mutations = useRecipeMutations()
        return () => h('div')
      }
    }))
    const key = ['recipes', '', '', '', '', 'asc', 20]
    const previous = pageData()
    cache.setQueryData(key, previous)

    await expect(mutations.create.mutateAsync({
      body: new FormData(),
      optimisticRecipe: makeRecipe('temporary-id')
    })).rejects.toThrow('failed')

    expect(cache.getQueryData(key)).toEqual(previous)
    wrapper.unmount()
  })

  it('optimistically updates and removes recipes in list and detail caches', async () => {
    fetchMock.mockResolvedValue(undefined)
    let cache!: ReturnType<typeof useQueryCache>
    let mutations!: ReturnType<typeof useRecipeMutations>
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        cache = useQueryCache()
        mutations = useRecipeMutations()
        return () => h('div')
      }
    }))
    const key = ['recipes', '', '', '', '', 'asc', 20]
    const recipe = makeRecipe('recipe-id')
    const updated = { ...recipe, name: 'Updated Soup' }
    cache.setQueryData(key, pageData([recipe]))
    cache.setQueryData(['recipe', recipe.id], recipe)

    await mutations.update.mutateAsync({
      id: recipe.id,
      body: new FormData(),
      optimisticRecipe: updated
    })
    expect(cache.getQueryData<{ pages: ReadRecipePageResponse[] }>(key)
      ?.pages[0]?.items).toEqual([updated])
    expect(cache.getQueryData(['recipe', recipe.id])).toEqual(updated)

    await mutations.remove.mutateAsync({ id: recipe.id })
    expect(cache.getQueryData<{ pages: ReadRecipePageResponse[] }>(key)
      ?.pages[0]?.items).toEqual([])
    expect(cache.getQueryData(['recipe', recipe.id])).toBeNull()
    wrapper.unmount()
  })

  it('rolls back optimistic update and delete failures', async () => {
    fetchMock.mockRejectedValue(new Error('failed'))
    let cache!: ReturnType<typeof useQueryCache>
    let mutations!: ReturnType<typeof useRecipeMutations>
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        cache = useQueryCache()
        mutations = useRecipeMutations()
        return () => h('div')
      }
    }))
    const key = ['recipes', '', '', '', '', 'asc', 20]
    const recipe = makeRecipe('recipe-id')
    cache.setQueryData(key, pageData([recipe]))
    cache.setQueryData(['recipe', recipe.id], recipe)

    await expect(mutations.update.mutateAsync({
      id: recipe.id,
      body: new FormData(),
      optimisticRecipe: { ...recipe, name: 'Updated Soup' }
    })).rejects.toThrow('failed')
    expect(cache.getQueryData<{ pages: ReadRecipePageResponse[] }>(key)
      ?.pages[0]?.items).toEqual([recipe])
    expect(cache.getQueryData(['recipe', recipe.id])).toEqual(recipe)

    await expect(mutations.remove.mutateAsync({ id: recipe.id }))
      .rejects.toThrow('failed')
    expect(cache.getQueryData<{ pages: ReadRecipePageResponse[] }>(key)
      ?.pages[0]?.items).toEqual([recipe])
    expect(cache.getQueryData(['recipe', recipe.id])).toEqual(recipe)
    wrapper.unmount()
  })
})
