import type { ListRecipesApiQuery } from '../../types/recipe'

export const useRecipes = () => {
  const onlineRecipes = useOnlineRecipes()
  const offlineRecipes = import.meta.client ? useOfflineRecipes() : null

  const getPage = async (query: ListRecipesApiQuery) => {
    if (offlineRecipes && !navigator.onLine) return offlineRecipes.getPage(query)
    try {
      const page = await onlineRecipes.getPage(query)
      if (offlineRecipes) void offlineRecipes.cachePage(page)
      return page
    } catch (error) {
      if (offlineRecipes) {
        const cached = await offlineRecipes.getPage(query)
        if (cached.items.length) return cached
      }
      throw error
    }
  }

  const getRecipe = async (id: string) => {
    if (offlineRecipes && !navigator.onLine) return offlineRecipes.getRecipe(id)
    try {
      const recipe = await onlineRecipes.getRecipe(id)
      if (recipe && offlineRecipes) void offlineRecipes.cacheRecipe(recipe)
      return recipe
    } catch (error) {
      if (offlineRecipes) return offlineRecipes.getRecipe(id)
      throw error
    }
  }

  return { getPage, getRecipe }
}
