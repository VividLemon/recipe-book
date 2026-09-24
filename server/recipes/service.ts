import type { RecipeData } from './types'
import { useRecipeRepository } from './repository'

export const getAllRecipes = async (): Promise<RecipeData[]> =>
  useRecipeRepository().list()
