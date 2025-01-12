import type { RecipeTag } from '../../types/recipe'
import { useRecipeTagsStorage } from './mongo'

export const getRecipeTags = async () => {
  const storage = useRecipeTagsStorage()
  const keys = await storage.getKeys()
  return (await Promise.all(
    keys.map((el) => storage.getItem(el))
  )) as RecipeTag[]
}

const recipeTagFallback = Object.freeze({
  createdAt: Date.now(),
  id: '',
  text: '',
  variant: undefined
})
export const recipeTagIdToRecipeTag = (ids: string[], tags: RecipeTag[]) =>
  ids.map((tagId) => tags.find((tag) => tag.id === tagId) || recipeTagFallback)

export const getAllRecipes = async () => {
  const storage = useRecipeStorage()
  const keys = await storage.getKeys()
  return await Promise.all(keys.map((el) => storage.getItem(el)))
}
