import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { RecipeTagWeb, RecipeWeb } from '../../../types/recipe'

interface RecipeBookDB extends DBSchema {
  recipes: { key: string; value: RecipeWeb }
  tags: { key: string; value: RecipeTagWeb }
}

const databaseName = 'recipe-book'

let database: Promise<IDBPDatabase<RecipeBookDB>> | undefined
const db = () => {
  database ??= openDB<RecipeBookDB>(databaseName, 1, {
    upgrade(store) {
      store.createObjectStore('recipes', { keyPath: 'id' })
      store.createObjectStore('tags', { keyPath: 'id' })
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
  }
}

export type LocalRecipeStore = typeof localRecipeStore
