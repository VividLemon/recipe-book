import type { CreateRecipeRequest, RecipeData, UpdateRecipeRequest } from '../../types/recipe'
import { useRecipeRepository } from './repository'
import {
  deletePhoto,
  deletePhotos,
  listRemovedRecipePhotoUrls,
  processPhoto,
  processPhotoWithThumbnail
} from '../photos/operations'
import { listImageVariantUrls } from '~/utils/photoVariants'
import { mapIngredientWebToData, mapRecipeDifficultyWebToData } from '../utils/mappers'
import sanitizeHtml from 'sanitize-html'
import { v7 } from 'uuid'
import { consola } from 'consola'
import { notFoundError } from '../utils/errors'
import { maximumRecipeStepsPhotoDimensions } from '~/utils/shared'

export const createRecipe = async (input: CreateRecipeRequest): Promise<RecipeData> => {
  const { coverImage: file, ...rest } = input

  const photoResult = file ? await processPhotoWithThumbnail(file) : undefined
  if (photoResult?.error) throw photoResult.error

  const recipe: RecipeData = {
    ...rest,
    id: v7(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: photoResult?.photos || rest.stepsImages
      ? {
          ...(photoResult?.photos ? { coverImage: photoResult.photos } : {}),
          ...(rest.stepsImages ? { stepsImages: rest.stepsImages } : {})
        }
      : undefined
  }

  try {
    await useRecipeRepository().set(recipe)
  }
  catch (e) {
    if (photoResult?.photos) await cleanupUploadedCoverImage(photoResult.photos)
    throw e
  }

  return recipe
}

export const updateRecipe = async (
  id: string,
  input: UpdateRecipeRequest
) => {
  const { coverImage: file, ...rest } = input

  const previous = await useRecipeRepository().get(id)
  if (!previous) throw notFoundError

  const photo = file ? await processPhotoWithThumbnail(file) : undefined
  if (photo?.error) throw photo.error

  const recipe: RecipeData = {
    ...previous,
    ...rest,
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: file
      ? { ...previous.photos, ...(photo?.photos ? { coverImage: photo.photos } : {}) }
      : previous.photos
  }

  try {
    await useRecipeRepository().set(recipe)
  }
  catch (e) {
    if (photo?.photos) await cleanupUploadedCoverImage(photo.photos)
    throw e
  }

  return { newRecipe: recipe, previousRecipe: previous }
}

const cleanupUploadedCoverImage = async (photos: NonNullable<RecipeData['photos']>['coverImage']) => {
  const results = await Promise.allSettled(
    [...listImageVariantUrls(photos?.default), ...listImageVariantUrls(photos?.thumbnail)].map((photo) => deletePhoto(photo))
  )
  results.forEach((result) => {
    if (result.status === 'rejected') {
      consola.error('Failed to clean up uploaded cover image:', result.reason)
    }
  })
}

export const addStepPhoto = async (recipe: RecipeData, photo: string) =>
  useRecipeRepository().set({
    ...recipe,
    photos: {
      ...recipe.photos,
      stepsImages: [...(recipe.photos?.stepsImages ?? []), photo]
    }
  })

export const addOrphanedStepPhoto = async ({
  file,
  recipeId,
  preserveAspectRatio
}: {
  file: Buffer
  recipeId?: string
  preserveAspectRatio?: boolean
}): Promise<string> => {
  const [recipeResult, photoResult] = await Promise.allSettled([
    recipeId ? useRecipeRepository().get(recipeId) : Promise.resolve(null),
    processPhoto(file, {
      maximumDimensions: maximumRecipeStepsPhotoDimensions,
      preserveAspectRatio: preserveAspectRatio,
    }),
  ])

  const previousRecipe =
    recipeResult.status === "fulfilled" ? recipeResult.value : null

  const photoResultValue =
    photoResult.status === "fulfilled" ? photoResult.value : null

// If photo processing itself threw, propagate that error.
  if (photoResult.status === "rejected") {
    throw photoResult.reason
  }

  const { photo: photoUrl, error: photoError } = photoResult.value

// If getRecipe threw, clean up the photo before propagating the error.
  if (recipeResult.status === "rejected") {
    if (photoUrl) await deletePhoto(photoUrl)
    throw recipeResult.reason
  }

  if (photoError || !photoUrl) {
    throw photoError
  }

// A recipe ID was supplied but the recipe doesn't exist.
  if (recipeId && !previousRecipe) {
    await deletePhoto(photoUrl)
    throw notFoundError
  }

  if (previousRecipe) {
    try {
      await addStepPhoto(previousRecipe, photoUrl)
    } catch (error) {
      await deletePhoto(photoUrl)
      throw error
    }
  }

  return photoUrl
}

export const cleanupReplacedRecipePhotos = (previous: RecipeData, next: RecipeData) =>
  deletePhotos(listRemovedRecipePhotoUrls({ previous, next }))
