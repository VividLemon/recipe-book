import type { LocalRecipeStore } from './localStore'
import { queryLocalRecipes } from './query'
import type { RecipeSource } from './types'

export const createLocalRecipeSource = (store: LocalRecipeStore): RecipeSource => ({
  listPage: async (query) => queryLocalRecipes(await store.getAllRecipes(), query),
  get: (id) => store.getRecipe(id),
  listTags: () => store.getTags()
})
