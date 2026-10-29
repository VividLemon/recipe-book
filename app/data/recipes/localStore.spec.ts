import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { localRecipeStore } from './localStore'
import { createLocalRecipeSource } from './localSource'
import type { RecipeWeb } from '../../../types/recipe'

const recipe = (id: string, createdAt: number): RecipeWeb => ({
  id, createdAt, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1
})

describe('localRecipeStore', () => {
  it('stores, reads and deletes recipes', async () => {
    await localRecipeStore.putRecipes([recipe('a', 2), recipe('b', 1)])
    await localRecipeStore.putRecipes([{ ...recipe('a', 2), name: 'renamed' }])
    expect((await localRecipeStore.getRecipe('a'))?.name).toBe('renamed')

    const source = createLocalRecipeSource(localRecipeStore)
    expect((await source.listPage({})).items.map((el) => el.id)).toEqual(['b', 'a'])

    await localRecipeStore.deleteRecipe('a')
    expect(await localRecipeStore.getRecipe('a')).toBeNull()
  })

  it('replaces tags', async () => {
    await localRecipeStore.replaceTags([{ id: 'x', createdAt: 1, text: 'X' }])
    await localRecipeStore.replaceTags([{ id: 'y', createdAt: 1, text: 'Y' }])
    expect((await localRecipeStore.getTags()).map((el) => el.id)).toEqual(['y'])
  })
})

describe('localRecipeStore sync helpers', () => {
  it('replaces everything at once and clears on demand', async () => {
    await localRecipeStore.putRecipes([recipe('stale', 1)])
    await localRecipeStore.replaceAll({
      recipes: [recipe('fresh', 1)],
      tags: [{ id: 't', createdAt: 1, text: 'T' }],
      meta: { userId: 'me', lastSyncedAt: 5 }
    })
    expect((await localRecipeStore.getAllRecipes()).map((el) => el.id)).toEqual(['fresh'])
    expect(await localRecipeStore.getMeta()).toEqual({ userId: 'me', lastSyncedAt: 5 })

    await localRecipeStore.clear()
    expect(await localRecipeStore.getAllRecipes()).toEqual([])
    expect(await localRecipeStore.getTags()).toEqual([])
    expect(await localRecipeStore.getMeta()).toBeNull()
  })
})
