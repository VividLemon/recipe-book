import type { RecipePageResponse, RecipeTagWeb, RecipeWeb } from '../../../types/recipe'
import type { RecipeSource } from './types'

export const createHttpRecipeSource = (fetch: ReturnType<typeof useRequestFetch>): RecipeSource => ({
  listPage: (query, { signal } = {}) => fetch<RecipePageResponse>('/api/recipes', { query, signal }),
  // The API answers 204 (no body) for recipes that are missing or not visible
  get: async (id, { signal } = {}) => (await fetch<RecipeWeb | undefined>(`/api/recipes/${id}`, { signal })) || null,
  listTags: ({ signal } = {}) => fetch<RecipeTagWeb[]>('/api/recipe-tags', { signal })
})
