import type { RecipeWeb } from '../../types/recipe'

export const useOnlineRecipe = () => {
  const online = useOnline()
  const fetch = async (id: string) => {
    if (import.meta.client && !online.value) return null
    return $fetch<RecipeWeb | null>(`/api/recipes/${id}`).catch(() => null)
  }
  return {
    fetch,
    isOnline: computed(() => !import.meta.client || online.value)
  }
}
