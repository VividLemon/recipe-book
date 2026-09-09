import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { useRecipeTagsStorage } from './storage/data'

export const getRecipeTags = async (): Promise<(RecipeTagData | null)[]> => {
  const storage = useRecipeTagsStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(
    keys.map((el) => storage.getItem(el))
  ))
}

export const getAllRecipes = async (): Promise<(RecipeData | null)[]> => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  return await Promise.all(keys.map((el) => storage.getItem(el)))
}
