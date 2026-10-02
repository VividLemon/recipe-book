import type { CreateRecipeRequest, RecipeData, UpdateRecipeRequest } from '../../types/recipe'
import { useRecipeRepository } from './repository'
import {
  deletePhoto,
  deletePhotos,
  deleteRecipePhotos,
  listRemovedRecipePhotoUrls,
  processPhotoWithThumbnail
} from '../photos/operations'
import { listImageVariantUrls } from '~/utils/photoVariants'
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
  const photoResult = file
    ? await Promise.allSettled([processPhotoWithThumbnail(file)])
    : []
  const processed = photoResult[0]?.status === 'fulfilled' ? photoResult[0].value : undefined
  if (photoResult[0]?.status === 'rejected') throw photoResult[0].reason
  if (processed?.error) throw processed.error

  const recipe: RecipeData = {
    ...rest,
    id: v7(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: processed?.photos || rest.stepsImages
      ? {
          ...(processed?.photos ? { coverImage: processed.photos } : {}),
          ...(rest.stepsImages ? { stepsImages: rest.stepsImages } : {})
        }
      : undefined
  }
  const persistence = await Promise.allSettled([useRecipeRepository().set(recipe)])
  if (persistence[0].status === 'rejected') {
    if (processed?.photos) await cleanupUploadedCoverImage(processed.photos)
    throw persistence[0].reason
  }
  return recipe
}

export const updateRecipe = async (
  id: string,
  input: UpdateRecipeRequest
): Promise<RecipeData> => {
  const previous = await getRecipe(id)
  if (!previous) throw notFoundError

  const { coverImage: file, ...rest } = input
  const photoResult = file
    ? await Promise.allSettled([processPhotoWithThumbnail(file)])
    : []
  const processed = photoResult[0]?.status === 'fulfilled' ? photoResult[0].value : undefined
  if (photoResult[0]?.status === 'rejected') throw photoResult[0].reason
  if (processed?.error) throw processed.error

  const recipe: RecipeData = {
    ...previous,
    ...rest,
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: file
      ? { ...previous.photos, ...(processed?.photos ? { coverImage: processed.photos } : {}) }
      : previous.photos
  }
  const persistence = await Promise.allSettled([useRecipeRepository().set(recipe)])
  if (persistence[0].status === 'rejected') {
    if (processed?.photos) await cleanupUploadedCoverImage(processed.photos)
    throw persistence[0].reason
  }
  if (file) {
    const cleanup = await Promise.allSettled([cleanupReplacedRecipePhotos(previous, recipe)])
    if (cleanup[0].status === 'rejected')
      consola.error('Cleanup previous photos exited with error:', cleanup[0].reason)
  }
  return recipe
}

const cleanupUploadedCoverImage = async (photos: NonNullable<RecipeData['photos']>['coverImage']) => {
  const results = await Promise.allSettled(
    listImageVariantUrls(photos?.default).concat(listImageVariantUrls(photos?.thumbnail))
      .map((photo) => deletePhoto(photo))
  )
  results.filter((result) => result.status === 'rejected').forEach((result) => {
    consola.error('Failed to clean up uploaded cover image:', result.reason)
  })
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
