import type { RecipeTagData } from './types'
import { useRecipeTagsRepository } from './repository'
import { v7 } from 'uuid'

export const getRecipeTags = async (): Promise<RecipeTagData[]> =>
  useRecipeTagsRepository().list()

export type CreateRecipeTagInput = Omit<RecipeTagData, 'id' | 'createdAt'>

export const createRecipeTag = async (
  input: CreateRecipeTagInput
): Promise<RecipeTagData> => {
  const tag: RecipeTagData = {
    ...input,
    id: v7(),
    createdAt: Date.now()
  }
  await useRecipeTagsRepository().set(tag)
  return tag
}

export const deleteRecipeTag = async (id: string) =>
  useRecipeTagsRepository().remove(id)
