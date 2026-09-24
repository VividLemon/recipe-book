import type { CreateRecipeRequest, RecipeData, UpdateRecipeRequest } from '../../types/recipe'
import { useRecipeRepository } from './repository'
import {
  deletePhotos,
  deleteRecipePhotos,
  listRemovedRecipePhotoUrls,
  processPhotoWithThumbnail
} from '../photos/operations'
import { mapIngredientWebToData, mapRecipeDifficultyWebToData } from '../utils/mappers'
import sanitizeHtml from 'sanitize-html'
import { v7 } from 'uuid'
import { consola } from 'consola'
import { notFoundError } from '../utils/errors'

export const getAllRecipes = async (): Promise<RecipeData[]> =>
  useRecipeRepository().list()

export const getRecipe = async (id: string): Promise<RecipeData | null> =>
  useRecipeRepository().get(id)

export const createRecipe = async (input: CreateRecipeRequest): Promise<RecipeData> => {
  const { coverImage: file, ...rest } = input
  const { photos: coverImage, error } = file
    ? await processPhotoWithThumbnail(file)
    : {}
  if (error) throw error

  const recipe: RecipeData = {
    ...rest,
    id: v7(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: coverImage || rest.stepsImages
      ? {
          ...(coverImage ? { coverImage } : {}),
          ...(rest.stepsImages ? { stepsImages: rest.stepsImages } : {})
        }
      : undefined
  }
  await useRecipeRepository().set(recipe)
  return recipe
}

export const updateRecipe = async (
  id: string,
  input: UpdateRecipeRequest
): Promise<RecipeData> => {
  const previous = await getRecipe(id)
  if (!previous) throw notFoundError

  const { coverImage: file, ...rest } = input
  const { photos: coverImage, error } = file
    ? await processPhotoWithThumbnail(file)
    : {}
  if (error) throw error

  const recipe: RecipeData = {
    ...previous,
    ...rest,
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: file
      ? { ...previous.photos, ...(coverImage ? { coverImage } : {}) }
      : previous.photos
  }
  await useRecipeRepository().set(recipe)
  void cleanupReplacedRecipePhotos(previous, recipe).catch((e) => {
    consola.error('Cleanup previous photos exited with error:', e)
  })
  return recipe
}

export const deleteRecipe = async (id: string) =>
  useRecipeRepository().remove(id)

export const addStepPhoto = async (recipe: RecipeData, photo: string) =>
  useRecipeRepository().set({
    ...recipe,
    photos: {
      ...recipe.photos,
      stepsImages: [...(recipe.photos?.stepsImages ?? []), photo]
    }
  })

export const cleanupRecipePhotos = (id: string) => deleteRecipePhotos(id)

export const cleanupReplacedRecipePhotos = (previous: RecipeData, next: RecipeData) =>
  deletePhotos(listRemovedRecipePhotoUrls({ previous, next }))
