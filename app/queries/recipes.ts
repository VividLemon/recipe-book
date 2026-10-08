import type {
  ListRecipesApiQuery,
  RecipePageResponse,
  RecipeWeb
} from '../../types/recipe'

export const RECIPE_STALE_TIME = 30_000

export const recipeKeys = {
  root: ['recipes'] as const,
  lists: () => [...recipeKeys.root, 'list'] as const,
  list: (query: ListRecipesApiQuery) => [...recipeKeys.lists(), query] as const,
  details: () => [...recipeKeys.root, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const
}

export const fetchRecipePage = (query: ListRecipesApiQuery) =>
  $fetch<RecipePageResponse>('/api/recipes', { query })

export const fetchRecipe = (id: string) =>
  $fetch<RecipeWeb | null>(`/api/recipes/${id}`)
