import type { ListRecipesApiQuery, RecipePageResponse, RecipeWeb } from '../../types/recipe'

export const useOnlineRecipes = () => {
  const requestFetch = useRequestFetch()

  const getPage = (query: ListRecipesApiQuery) =>
    requestFetch<RecipePageResponse>('/api/recipes', { query })

  const getRecipe = (id: string) =>
    requestFetch<RecipeWeb | null>(`/api/recipes/${id}`)

  return { getPage, getRecipe }
}
