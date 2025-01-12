import type { Recipe, UpdateRecipeRequest } from '../../../types/recipe'
import { deserializeFormData } from '../../../utils/serialization'
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
  const parsed = deserializeFormData<UpdateRecipeRequest>(raw)
  const z = recipes.update.body.safeParse(parsed)
  if (z.error) throw validationError(z.error)
  const { photos: file, stepsImages, ...rest } = z.data

  const { error, photos } = file
    ? await processPhotoWithThumbnail(event, file)
    : {}
  if (error) throw error

  const previousValuesNotToChange = {
    id: previous.id,
    createdAt: previous.createdAt
  } as const

  const recipe: Recipe = {
    ...previous,
    ...rest,
    updatedAt: Date.now(),
    photos: {
      coverImage: photos,
      stepsImages: [
        ...(previous.photos?.stepsImages || []),
        ...(stepsImages || [])
      ]
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
