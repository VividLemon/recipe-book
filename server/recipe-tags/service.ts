import type { RecipeTagData } from './types'
import { useRecipeTagsRepository } from './repository'
import { v7 } from 'uuid'

export const getRecipeTags = async (): Promise<RecipeTagData[]> =>
  (await useRecipeTagsRepository().find()).items

export type CreateRecipeTagInput = Omit<RecipeTagData, 'id' | 'createdAt'>

export const createRecipeTag = async (
  input: CreateRecipeTagInput
): Promise<RecipeTagData> => {
  const tag: RecipeTagData = {
    ...input,
    id: v7(),
    createdAt: Date.now()
  }
  await useRecipeTagsRepository().replaceOne({ id: tag.id }, tag)
  return tag
}

export const deleteRecipeTag = async (id: string) =>
  useRecipeTagsRepository().deleteOne({ id })
