import {
  type CreateRecipeRequest,
  type ListRecipesApiQuery,
  type RecipeData,
  type UpdateRecipeRequest
} from '../../types/recipe'
import { findRecipesByPhotoUrl, queryRecipePage, useRecipeRepository } from './repository'
import {
  deletePhoto,
  listRemovedRecipePhotoUrls,
  processPhoto,
  processPhotoWithThumbnail
} from '../photos/operations'
import { listImageVariantUrls } from '~/utils/photoVariants'
import { mapIngredientWebToData, mapRecipeDifficultyWebToData } from '../utils/mappers'
import sanitizeHtml from 'sanitize-html'
import { v7 } from 'uuid'
import { consola } from 'consola'
import { notFoundError, photoError } from '../utils/errors'
import { maximumRecipeStepsPhotoDimensions } from '~/utils/shared'
import { canAccessRecipe, canManageRecipe } from './access'

const assertStepPhotosAttachable = async (
  urls: string[] | undefined,
  userId: string,
  recipeId?: string
) => {
  const referenced = await Promise.all((urls ?? []).map(async (url) => {
    const owners = (await findRecipesByPhotoUrl(url)).filter((recipe) => recipe.id !== recipeId)
    return owners.every((recipe) => canManageRecipe(recipe, userId))
  }))
  if (referenced.some((allowed) => !allowed)) {
    throw photoError({ message: 'Step photo is attached to a recipe you do not own' })
  }
}

export const deleteUnreferencedPhotos = async (urls: string[], excludeRecipeId: string) => {
  await Promise.all(urls.map(async (url) => {
    const owners = await findRecipesByPhotoUrl(url)
    if (owners.some((recipe) => recipe.id !== excludeRecipeId)) return
    await deletePhoto(url)
  }))
}

export const createRecipe = async ({
  input,
  userId
}: {
  input: CreateRecipeRequest
  userId: string
}): Promise<RecipeData> => {
  const { coverImage: file, ...rest } = input

  await assertStepPhotosAttachable(rest.stepsImages, userId)
  const photoResult = file ? await processPhotoWithThumbnail(file) : undefined
  if (photoResult?.error) throw photoResult.error

  const recipe: RecipeData = {
    ...rest,
    ownerId: userId,
    isPublic: rest.isPublic ?? true,
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
    await useRecipeRepository().replaceOne({ id: recipe.id }, recipe)
  }
  catch (e) {
    if (photoResult?.photos) await cleanupUploadedCoverImage(photoResult.photos)
    throw e
  }

  return recipe
}

export const updateRecipe = async ({
  id,
  input,
  userId
}: {
  id: string
  input: UpdateRecipeRequest
  userId: string
}) => {
  const { coverImage: file, ...rest } = input

  const previous = await useRecipeRepository().findOne({ id })
  if (!previous || !canManageRecipe(previous, userId)) throw notFoundError

  const photo = file ? await processPhotoWithThumbnail(file) : undefined
  if (photo?.error) throw photo.error

  const recipe: RecipeData = {
    ...previous,
    ...rest,
    isPublic: rest.isPublic ?? previous.isPublic !== false,
    updatedAt: Date.now(),
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    steps: sanitizeHtml(rest.steps),
    photos: file
      ? { ...previous.photos, ...(photo?.photos ? { coverImage: photo.photos } : {}) }
      : previous.photos
  }

  try {
    await useRecipeRepository().replaceOne({ id: recipe.id }, recipe)
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
  useRecipeRepository().replaceOne({ id: recipe.id }, {
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
    recipeId ? useRecipeRepository().findOne({ id: recipeId }) : Promise.resolve(null),
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
  deleteUnreferencedPhotos(listRemovedRecipePhotoUrls({ previous, next }), next.id)

export const listRecipes = async ({
  query = {},
  userId,
  favoriteIds = new Set()
}: {
  query?: ListRecipesApiQuery
  userId?: string
  favoriteIds?: ReadonlySet<string>
} = {}) => queryRecipePage(query, userId, favoriteIds)

export const getAccessibleRecipe = async ({ id, userId }: { id: string; userId?: string }) => {
  const recipe = await useRecipeRepository().findOne({ id })
  if (!recipe || !canAccessRecipe(recipe, userId)) return null
  return recipe
}

export const deleteRecipe = async ({ id, userId }: { id: string; userId: string }) => {
  const recipe = await useRecipeRepository().findOne({ id })
  if (!recipe || !canManageRecipe(recipe, userId)) throw notFoundError
  await useRecipeRepository().deleteOne({ id })
  return recipe
}
