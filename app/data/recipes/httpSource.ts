import type { RecipePageResponse, RecipeTagWeb, RecipeWeb } from '../../../types/recipe'
import type { RecipeSource } from './types'

export const createHttpRecipeSource = (fetch: ReturnType<typeof useRequestFetch>): RecipeSource => ({
  listPage: (query) => fetch<RecipePageResponse>('/api/recipes', { query }),
  // The API answers 204 (no body) for recipes that are missing or not visible
  get: async (id) => (await fetch<RecipeWeb | undefined>(`/api/recipes/${id}`)) || null,
  listTags: () => fetch<RecipeTagWeb[]>('/api/recipe-tags')
})
