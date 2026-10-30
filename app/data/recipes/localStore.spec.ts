import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { localRecipeStore } from './localStore'
import { createLocalRecipeSource } from './localSource'
import type { RecipeWeb } from '../../../types/recipe'

const recipe = (id: string, createdAt: number, extra: Partial<RecipeWeb> = {}): RecipeWeb => ({
  id, ownerId: 'me', createdAt, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1, ...extra
})
const tag = (id: string) => ({ id, createdAt: 1, text: id })
const syncAs = (userId: string, recipes: RecipeWeb[] = []) =>
  localRecipeStore.replaceAll({ recipes, tags: [], meta: { userId, lastSyncedAt: 0 } })

describe('localRecipeStore', () => {
  beforeEach(() => localRecipeStore.clear())

  it('replaces everything at once, records completion and clears on demand', async () => {
    await syncAs('me', [recipe('stale', 1)])
    await localRecipeStore.replaceAll({
      recipes: [recipe('fresh', 1)],
      tags: [tag('t')],
      meta: { userId: 'me', lastSyncedAt: 0 }
    })
    expect((await localRecipeStore.getAllRecipes('me')).map((el) => el.id)).toEqual(['fresh'])
    await localRecipeStore.markSynced('me', 5)
    expect(await localRecipeStore.getMeta()).toEqual({ userId: 'me', lastSyncedAt: 5 })

    await localRecipeStore.clear()
    expect(await localRecipeStore.getAllRecipes(null)).toEqual([])
    expect(await localRecipeStore.getTags(null)).toEqual([])
    expect(await localRecipeStore.getMeta()).toBeNull()
  })

  it('updates only a copy the user owns', async () => {
    // Nothing synced yet: an incremental write cannot create a copy
    await localRecipeStore.putRecipes([recipe('a', 1)], 'me')
    await localRecipeStore.replaceTags([tag('x')], 'me')
    expect(await localRecipeStore.getMeta()).toBeNull()

    await syncAs('me')
    await localRecipeStore.putRecipes([recipe('a', 2), recipe('b', 1)], 'me')
    await localRecipeStore.putRecipes([recipe('intruder', 1)], 'someone-else')
    await localRecipeStore.replaceTags([tag('x')], 'me')
    await localRecipeStore.replaceTags([tag('y')], 'me')

    const source = createLocalRecipeSource(localRecipeStore, () => 'me')
    expect((await source.listPage({})).items.map((el) => el.id)).toEqual(['b', 'a'])
    expect((await source.listTags()).map((el) => el.id)).toEqual(['y'])
  })

  it('does not let an older copy replace a newer one', async () => {
    await syncAs('me', [recipe('a', 1, { updatedAt: 10, name: 'edited' })])
    await localRecipeStore.putRecipes([recipe('a', 1, { updatedAt: 5, name: 'stale' })], 'me')
    expect((await localRecipeStore.getRecipe('a', 'me'))?.name).toBe('edited')
  })

  it('keeps a write that lands after a wipe from restoring data', async () => {
    await syncAs('me', [recipe('a', 1)])
    await localRecipeStore.clear()
    await localRecipeStore.putRecipes([recipe('a', 1)], 'me')
    expect(await localRecipeStore.getAllRecipes(null)).toEqual([])
  })

  it('serves reads to the owner, or when no session could be checked, but not to other users', async () => {
    await syncAs('me', [recipe('a', 1)])
    expect(await localRecipeStore.getAllRecipes('me')).toHaveLength(1)
    expect(await localRecipeStore.getAllRecipes(null)).toHaveLength(1)
    expect(await localRecipeStore.getAllRecipes('someone-else')).toEqual([])
    expect(await localRecipeStore.getRecipe('a', 'someone-else')).toBeNull()
  })

  it('deletes recipes', async () => {
    await syncAs('me', [recipe('a', 1)])
    await localRecipeStore.deleteRecipe('a')
    expect(await localRecipeStore.getRecipe('a', 'me')).toBeNull()
  })
})
