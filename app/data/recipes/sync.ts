import {
  maximumRecipePageSize,
  type RecipePageResponse,
  type RecipeTagWeb,
  type RecipeWeb
} from '../../../types/recipe'
import type { LocalRecipeStore } from './localStore'
import { recipePhotoUrls, type ImageFormat } from './photos'

export interface SyncDependencies {
  fetch: <T>(url: string, options?: { query?: Record<string, unknown> }) => Promise<T>
  store: Pick<LocalRecipeStore, 'replaceAll'>
  syncPhotos: (urls: string[]) => Promise<void>
  imageFormat: ImageFormat
  now?: () => number
}

/**
 * Downloads all of the user's own recipes, the tags and every photo they show,
 * and replaces the device copy with them.
 */
export const syncOwnRecipes = async (
  userId: string,
  { fetch, store, syncPhotos, imageFormat, now = Date.now }: SyncDependencies
) => {
  const recipes: RecipeWeb[] = []
  for (let page: number | null = 1; page !== null;) {
    const result: RecipePageResponse = await fetch('/api/recipes', {
      query: { mine: true, page, pageSize: maximumRecipePageSize }
    })
    recipes.push(...result.items)
    page = result.nextPage
  }
  const tags = await fetch<RecipeTagWeb[]>('/api/recipe-tags')

  await store.replaceAll({ recipes, tags, meta: { userId, lastSyncedAt: now() } })
  await syncPhotos(recipePhotoUrls(recipes, imageFormat))
  return recipes.length
}
