import {
  maximumRecipePageSize,
  type RecipePageResponse,
  type RecipeTagWeb,
  type RecipeWeb
} from '../../../types/recipe'
import type { LocalRecipeStore } from './localStore'
import { recipePhotoUrls, type ImageFormat } from './photos'

export interface SyncDependencies {
  fetch: <T>(url: string, options: { query?: Record<string, unknown>; signal: AbortSignal }) => Promise<T>
  store: Pick<LocalRecipeStore, 'replaceAll' | 'markSynced'>
  /** Resolves to the number of photos that could not be downloaded. */
  syncPhotos: (urls: string[], signal: AbortSignal) => Promise<number>
  imageFormat: ImageFormat
  /** Aborted when the signed-in user changes; nothing is written after that. */
  signal: AbortSignal
  now?: () => number
}

/**
 * Downloads all of the user's own recipes, the tags and every photo they show,
 * and replaces the device copy with them. The sync only counts as complete
 * (`lastSyncedAt` set) once every photo is stored, so a retry happens otherwise.
 */
export const syncOwnRecipes = async (
  userId: string,
  { fetch, store, syncPhotos, imageFormat, signal, now = Date.now }: SyncDependencies
) => {
  const recipes: RecipeWeb[] = []
  for (let page: number | null = 1; page !== null;) {
    const result: RecipePageResponse = await fetch('/api/recipes', {
      query: { mine: true, page, pageSize: maximumRecipePageSize },
      signal
    })
    recipes.push(...result.items)
    page = result.nextPage
  }
  const tags = await fetch<RecipeTagWeb[]>('/api/recipe-tags', { signal })

  signal.throwIfAborted()
  await store.replaceAll({ recipes, tags, meta: { userId, lastSyncedAt: 0 } })
  const missing = await syncPhotos(recipePhotoUrls(recipes, imageFormat), signal)
  if (!missing) {
    signal.throwIfAborted()
    await store.markSynced(userId, now())
  }
  return recipes.length
}
