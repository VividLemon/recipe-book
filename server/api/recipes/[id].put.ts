import type { RecipeData } from '../../../types/recipe'
import { mapIngredientWebToData, mapRecipeDifficultyWebToData } from '../../utils/mappers'
import { deserializeFormData } from '~/utils/serialization'
import { notFoundError } from '../../utils/errors'
import { useRecipeStorage } from '../../utils/mongo'
import { processPhotoWithThumbnail } from '../../utils/photo'
import { recipes } from '../../utils/validation'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const [{ id }, raw] = await Promise.all([
    getValidatedRouterParams(event, recipes.update.params.parse),
    readMultipartFormData(event)
  ])
  if (!raw) throw noDataError
  const previous = Object.freeze(await storage.getItem(id))
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

  const cleanupPreviousPhotos = async () => {
    try {
      throw new Error('Not implemented')
      // TODO: Implement this function
    } catch (e) {
      console.error('Cleanup previous photos', e)
    }
  }

  await Promise.all([cleanupPreviousPhotos(), storage.setItem(id, recipe)])
  setResponseStatus(event, 204)
})
