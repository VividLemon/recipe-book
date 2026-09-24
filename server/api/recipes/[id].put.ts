import type { RecipeData } from '../../../types/recipe'
import { mapIngredientWebToData, mapRecipeDifficultyWebToData } from '../../utils/mappers'
import { deserializeFormData } from '~/utils/serialization'
import { notFoundError } from '../../utils/errors'
import { cleanupReplacedRecipePhotos, getRecipe, updateRecipe } from '../../recipes/service'
import { processPhotoWithThumbnail } from '../../photos/operations'
import { recipes } from '../../utils/validation'
import sanitizeHtml from 'sanitize-html'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const [{ id }, raw] = await Promise.all([
    getValidatedRouterParams(event, recipes.update.params.parse),
    readMultipartFormData(event)
  ])
  if (!raw) throw noDataError
  const previous = Object.freeze(await getRecipe(id))
  if (!previous) throw notFoundError
  const parsed = deserializeFormData(raw)
  const z = await recipes.update.body.safeParseAsync(parsed)
  if (z.error) throw validationError(z.error)
  const { coverImage: file, ...rest } = z.data

  const { error, photos: coverImage } = file
    ? await processPhotoWithThumbnail(file)
    : {}
  if (error) throw error

  const previousValuesNotToChange = {
    id: previous.id,
    createdAt: previous.createdAt
  } as const

  const recipe: RecipeData = {
    ...previous,
    ...rest,
    ingredients: rest.ingredients.map(mapIngredientWebToData),
    difficulty: mapRecipeDifficultyWebToData(rest.difficulty),
    updatedAt: Date.now(),
    photos: {
      ...previous.photos,
      coverImage
    },
    steps: sanitizeHtml(rest.steps),
    ...previousValuesNotToChange
  }

  // Remove any photos that are no longer used in the updated recipe
  event.waitUntil(
    cleanupReplacedRecipePhotos(
      previous,
      recipe
    ).catch((e) => {
      consola.error('Cleanup previous photos exited with error:', e)
    })
  )

  await updateRecipe(recipe)
  setResponseStatus(event, 204)
})
