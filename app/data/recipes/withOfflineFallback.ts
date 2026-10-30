import type { RecipeTagWeb, RecipeWeb } from '../../../types/recipe'
import type { RecipeSource, RecipeSourceOptions } from './types'

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

export interface DeviceWriter {
  putRecipes(recipes: RecipeWeb[], userId: string): Promise<void>
  replaceTags(tags: RecipeTagWeb[], userId: string): Promise<void>
}

/**
 * Decorates a remote source: the signed-in user's own recipes (and the tags)
 * are copied to the device as they arrive, and the device copy answers when
 * the network does not.
 */
export const withOfflineFallback = (
  remote: RecipeSource,
  local: RecipeSource,
  store: DeviceWriter,
  { userId }: { userId: () => string | null }
): RecipeSource => {
  const fallback = async <T>(
    { signal }: RecipeSourceOptions,
    request: () => Promise<T>,
    offline: () => Promise<T>,
    save: (value: T, owner: string) => Promise<void>
  ) => {
    let value: T
    try {
      value = await request()
    } catch (error) {
      // A cancelled request is not an outage: report it rather than answer from the device
      if (!signal?.aborted && isNetworkError(error)) return offline()
      throw error
    }
    // A cancelled request may be outdated (e.g. a recipe deleted meanwhile), so it is not saved.
    // The owner is read after the response so a sign-out during the request saves nothing.
    const owner = userId()
    if (owner && !signal?.aborted) {
      // Saving is best effort: a full or blocked IndexedDB must not break the page
      await save(value, owner).catch(() => {})
    }
    return value
  }

  return {
    listPage: (query, options = {}) => fallback(
      options,
      () => remote.listPage(query, options),
      () => local.listPage(query, options),
      (page, owner) => store.putRecipes(page.items.filter((recipe) => recipe.ownerId === owner), owner)
    ),
    get: (id, options = {}) => fallback(
      options,
      () => remote.get(id, options),
      () => local.get(id, options),
      async (recipe, owner) => {
        if (recipe?.ownerId === owner) await store.putRecipes([recipe], owner)
      }
    ),
    listTags: (options = {}) => fallback(
      options,
      () => remote.listTags(options),
      () => local.listTags(options),
      (tags, owner) => store.replaceTags(tags, owner)
    )
  }
}
