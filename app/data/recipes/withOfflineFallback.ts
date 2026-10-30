import type { RecipeWeb } from '../../../types/recipe'
import type { LocalRecipeStore } from './localStore'
import type { RecipeSource } from './types'

/**
 * True when a request never got a usable answer from the server: no response
 * at all (offline, DNS, CORS) or a gateway error from a proxy in between.
 * Real answers such as 401/404/500 are not network errors.
 */
export const isNetworkError = (error: unknown) => {
  if (error instanceof TypeError) return true
  if (!(error instanceof Error) || error.name !== 'FetchError') return false
  const status = (error as Error & { statusCode?: number }).statusCode
  return status === undefined || status === 502 || status === 503 || status === 504
}

/**
 * Decorates a remote source: results are copied into the device store as they
 * arrive, and the device copy answers when the network does not.
 * Only recipes accepted by `keep` (the user's own) are stored.
 */
export const withOfflineFallback = (
  remote: RecipeSource,
  local: RecipeSource,
  store: Pick<LocalRecipeStore, 'putRecipes' | 'replaceTags'>,
  { keep }: { keep: (recipe: RecipeWeb) => boolean }
): RecipeSource => {
  const fallback = async <T>(request: () => Promise<T>, offline: () => Promise<T>, save: (value: T) => Promise<void>) => {
    let value: T
    try {
      value = await request()
    } catch (error) {
      if (isNetworkError(error)) return offline()
      throw error
    }
    // Saving is best effort: a full or blocked IndexedDB must not break the page
    await save(value).catch(() => {})
    return value
  }

  return {
    listPage: (query) => fallback(
      () => remote.listPage(query),
      () => local.listPage(query),
      (page) => store.putRecipes(page.items.filter(keep))
    ),
    get: (id) => fallback(
      () => remote.get(id),
      () => local.get(id),
      async (recipe) => {
        if (recipe && keep(recipe)) await store.putRecipes([recipe])
      }
    ),
    listTags: () => fallback(
      () => remote.listTags(),
      () => local.listTags(),
      (tags) => store.replaceTags(tags)
    )
  }
}
