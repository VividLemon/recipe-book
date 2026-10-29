import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { RecipeTagWeb, RecipeWeb } from '../../../types/recipe'

export interface LocalSyncMeta {
  userId: string
  lastSyncedAt: number
}

interface RecipeBookDB extends DBSchema {
  recipes: { key: string; value: RecipeWeb }
  tags: { key: string; value: RecipeTagWeb }
  meta: { key: 'sync'; value: LocalSyncMeta }
}

const databaseName = 'recipe-book'

let database: Promise<IDBPDatabase<RecipeBookDB>> | undefined
const db = () => {
  database ??= openDB<RecipeBookDB>(databaseName, 2, {
    upgrade(store, oldVersion) {
      if (oldVersion < 1) {
        store.createObjectStore('recipes', { keyPath: 'id' })
        store.createObjectStore('tags', { keyPath: 'id' })
      }
      if (oldVersion < 2) store.createObjectStore('meta')
    }
  })
  return database
}

/**
 * Device copy of recipes and tags in IndexedDB. Browser only: callers must not
 * use it during server rendering.
 */
export const localRecipeStore = {
  async getAllRecipes() {
    return (await db()).getAll('recipes')
  },
  async getRecipe(id: string) {
    return (await (await db()).get('recipes', id)) ?? null
  },
  async putRecipes(recipes: RecipeWeb[]) {
    if (!recipes.length) return
    const tx = (await db()).transaction('recipes', 'readwrite')
    await Promise.all([...recipes.map((recipe) => tx.store.put(recipe)), tx.done])
  },
  async deleteRecipe(id: string) {
    await (await db()).delete('recipes', id)
  },
  async getTags() {
    return (await db()).getAll('tags')
  },
  async replaceTags(tags: RecipeTagWeb[]) {
    const tx = (await db()).transaction('tags', 'readwrite')
    await Promise.all([tx.store.clear(), ...tags.map((tag) => tx.store.put(tag)), tx.done])
  },
  /** Swaps in a full sync result atomically, dropping recipes deleted on the server. */
  async replaceAll({ recipes, tags, meta }: { recipes: RecipeWeb[]; tags: RecipeTagWeb[]; meta: LocalSyncMeta }) {
    const tx = (await db()).transaction(['recipes', 'tags', 'meta'], 'readwrite')
    const recipeStore = tx.objectStore('recipes')
    const tagStore = tx.objectStore('tags')
    await Promise.all([
      recipeStore.clear(),
      tagStore.clear(),
      ...recipes.map((recipe) => recipeStore.put(recipe)),
      ...tags.map((tag) => tagStore.put(tag)),
      tx.objectStore('meta').put(meta, 'sync'),
      tx.done
    ])
  },
  async getMeta() {
    return (await (await db()).get('meta', 'sync')) ?? null
  },
  async clear() {
    const tx = (await db()).transaction(['recipes', 'tags', 'meta'], 'readwrite')
    await Promise.all([
      tx.objectStore('recipes').clear(),
      tx.objectStore('tags').clear(),
      tx.objectStore('meta').clear(),
      tx.done
    ])
  }
}

export type LocalRecipeStore = typeof localRecipeStore
