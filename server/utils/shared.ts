import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { useRecipeTagsStorage } from './mongo'

export const getRecipeTags = async (): Promise<RecipeTagData[]> => {
  const storage = useRecipeTagsStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(keys.map((el) => storage.getItem(el)))).filter(
    (tag): tag is RecipeTagData => tag !== null
  )
}

export const getAllRecipes = async (): Promise<RecipeData[]> => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(keys.map((el) => storage.getItem(el)))).filter(
    (recipe): recipe is RecipeData => recipe !== null
  )
}
