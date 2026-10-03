import { useQueryCache } from '@pinia/colada'
import { recipeKeys } from '~/queries/recipes'

export const useRecipeSessionCache = () => {
  const queryCache = useQueryCache()
  return () => {
    for (const entry of queryCache.getEntries({ key: recipeKeys.root })) {
      queryCache.remove(entry)
    }
  }
}
