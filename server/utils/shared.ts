import type { RecipeTagData } from '../../types/recipe'
import { useRecipeTagsStorage } from './mongo'

export const getRecipeTags = async () => {
  const storage = useRecipeTagsStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(
    keys.map((el) => storage.getItem(el))
  )) as RecipeTagData[]
}

export const getAllRecipes = async () => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  return await Promise.all(keys.map((el) => storage.getItem(el)))
}
