import type { LocalRecipeStore } from './localStore'
import { queryLocalRecipes } from './query'
import type { RecipeSource } from './types'

/** Device-backed reads, limited to the data `userId` owns (see `localRecipeStore`). */
export const createLocalRecipeSource = (
  store: Pick<LocalRecipeStore, 'getAllRecipes' | 'getRecipe' | 'getTags'>,
  userId: () => string | null
): RecipeSource => ({
  listPage: async (query) => ({ ...queryLocalRecipes(await store.getAllRecipes(userId()), query), fromDevice: true as const }),
  get: (id) => store.getRecipe(id, userId()),
  listTags: () => store.getTags(userId())
})
