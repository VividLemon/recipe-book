import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb'
import type { RecipeTagWeb, RecipeWeb } from '../../../types/recipe'

export interface LocalSyncMeta {
  /** The user the stored data belongs to. */
  userId: string
  /** When the last full sync finished; 0 until one has. */
  lastSyncedAt: number
}

interface RecipeBookDB extends DBSchema {
  recipes: { key: string; value: RecipeWeb }
  tags: { key: string; value: RecipeTagWeb }
  meta: { key: 'sync'; value: LocalSyncMeta }
}

type Store = 'recipes' | 'tags' | 'meta'
type WriteTransaction = IDBPTransaction<RecipeBookDB, Store[], 'readwrite'>

const databaseName = 'recipe-book'
const allStores: Store[] = ['recipes', 'tags', 'meta']

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
 * Only a full sync (`replaceAll`) makes a user the owner of the device copy.
 * Other writes just update a copy `userId` already owns, so a write landing
 * after a sign-out wipe or for another user changes nothing. The check runs in
 * the write's own transaction, so a wipe cannot slip in between.
 */
const owns = async (tx: WriteTransaction, userId: string) =>
  (await tx.objectStore('meta').get('sync'))?.userId === userId

/** Reads are allowed for the owner, or for anyone when no session could be checked (offline start). */
const readable = async (userId: string | null) => {
  const meta = await (await db()).get('meta', 'sync')
  return !!meta && (userId === null || meta.userId === userId)
}

/**
 * Device copy of a single user's recipes and tags in IndexedDB. Browser only:
 * callers must not use it during server rendering.
 */
export const localRecipeStore = {
  async getAllRecipes(userId: string | null) {
    return await readable(userId) ? (await db()).getAll('recipes') : []
  },
  async getRecipe(id: string, userId: string | null) {
    return await readable(userId) ? (await (await db()).get('recipes', id)) ?? null : null
  },
  async getTags(userId: string | null) {
    return await readable(userId) ? (await db()).getAll('tags') : []
  },
  /** Updates `userId`'s copy, never replacing a stored recipe with an older version. */
  async putRecipes(recipes: RecipeWeb[], userId: string) {
    if (!recipes.length) return
    const tx = (await db()).transaction(allStores, 'readwrite')
    if (await owns(tx, userId)) {
      const store = tx.objectStore('recipes')
      await Promise.all(recipes.map(async (recipe) => {
        const stored = await store.get(recipe.id)
        if (!stored || stored.updatedAt <= recipe.updatedAt) await store.put(recipe)
      }))
    }
    await tx.done
  },
  async deleteRecipe(id: string) {
    await (await db()).delete('recipes', id)
  },
  async replaceTags(tags: RecipeTagWeb[], userId: string) {
    const tx = (await db()).transaction(allStores, 'readwrite')
    if (await owns(tx, userId)) {
      const store = tx.objectStore('tags')
      // Issued in order within one transaction: the clear completes before the puts
      await Promise.all([store.clear(), ...tags.map((tag) => store.put(tag))])
    }
    await tx.done
  },
  /** Swaps in a full sync result atomically, dropping recipes deleted on the server. */
  async replaceAll({ recipes, tags, meta }: { recipes: RecipeWeb[]; tags: RecipeTagWeb[]; meta: LocalSyncMeta }) {
    const tx = (await db()).transaction(allStores, 'readwrite')
    const recipeStore = tx.objectStore('recipes')
    const tagStore = tx.objectStore('tags')
    // Issued in order within one transaction: the clears complete before the puts
    await Promise.all([
      recipeStore.clear(),
      tagStore.clear(),
      ...recipes.map((recipe) => recipeStore.put(recipe)),
      ...tags.map((tag) => tagStore.put(tag)),
      tx.objectStore('meta').put(meta, 'sync'),
      tx.done
    ])
  },
  /** Records a completed sync, unless the data changed hands meanwhile. */
  async markSynced(userId: string, at: number) {
    const tx = (await db()).transaction('meta', 'readwrite')
    const meta = await tx.store.get('sync')
    if (meta?.userId === userId) await tx.store.put({ userId, lastSyncedAt: at }, 'sync')
    await tx.done
  },
  async getMeta() {
    return (await (await db()).get('meta', 'sync')) ?? null
  },
  async clear() {
    const tx = (await db()).transaction(allStores, 'readwrite')
    await Promise.all([
      tx.objectStore('recipes').clear(),
      tx.objectStore('tags').clear(),
      tx.objectStore('meta').clear(),
      tx.done
    ])
  }
}

export type LocalRecipeStore = typeof localRecipeStore
