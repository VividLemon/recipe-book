import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { useRecipeRepository, useRecipeTagsRepository } from './storage'

export const getRecipeTags = async (): Promise<RecipeTagData[]> => {
  return useRecipeTagsRepository().list()
}

export const getAllRecipes = async (): Promise<RecipeData[]> => {
  return useRecipeRepository().list()
}
