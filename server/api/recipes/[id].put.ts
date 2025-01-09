import type { Recipe, UpdateRecipeRequest } from '../../../types/recipe'
import { deserializeFormData } from '../../../utils/serialization'
import { notFoundError } from '../../utils/errors'
import { useRecipeStorage } from '../../utils/mongo'
import { processPhoto } from '../../utils/photo'
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
  const { photo: file, ...rest } = z.data

  const { error, photo } = file ? await processPhoto(file, event) : {}
  if (error) throw error

  const previousValuesNotToChange = {
    id: previous.id,
    createdAt: previous.createdAt
  } as const

  const recipe: Recipe = {
    ...previous,
    ...rest,
    updatedAt: Date.now(),
    photo: photo ?? undefined,
    steps: sanitizeHtml(rest.steps),
    ...previousValuesNotToChange
  }

  const cleanupPreviousPhotos = async () => {
    // TODO: Implement this function
  }

  await Promise.all([cleanupPreviousPhotos(), storage.setItem(id, recipe)])
  setResponseStatus(event, 204)
})
