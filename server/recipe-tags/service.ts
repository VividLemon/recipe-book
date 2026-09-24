import type { RecipeTagData } from './types'
import { useRecipeTagsRepository } from './repository'

export const getRecipeTags = async (): Promise<RecipeTagData[]> =>
  useRecipeTagsRepository().list()

export const createRecipeTag = async (tag: RecipeTagData) =>
  useRecipeTagsRepository().set(tag)

export const deleteRecipeTag = async (id: string) =>
  useRecipeTagsRepository().remove(id)
