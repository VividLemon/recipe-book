import type { RecipeTagData } from './types'
import { useRecipeTagsRepository } from './repository'

export const getRecipeTags = async (): Promise<RecipeTagData[]> =>
  useRecipeTagsRepository().list()
