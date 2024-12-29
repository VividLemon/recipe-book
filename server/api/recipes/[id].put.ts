import type { Recipe } from '../../../types/recipe'
import { noDataError, notFoundError, validationError } from '../../utils/errors'
import { useRecipeStorage } from '../../utils/mongo'
import { processPhoto } from '../../utils/photo'
import { parseMultipartFormDataToRecipe, recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const [{ id }, raw] = await Promise.all([
    getValidatedRouterParams(event, recipes.update.params.parse),
    readMultipartFormData(event)
  ])

  if (!raw) throw noDataError
  const obj = raw.reduce(
    parseMultipartFormDataToRecipe,
    {} as Record<string, unknown>
  )
  const z = recipes.update.body.safeParse(obj)
  if (z.error) throw validationError(z.error)
  const { photo: file, ...rest } = z.data

  const previous = await storage.getItem(id)
  if (!previous) throw notFoundError

  const { error, photo } = file ? await processPhoto(file, event) : {}
  if (error) throw error

  const recipe: Recipe = {
    ...previous,
    ...rest,
    id: previous.id,
    createdAt: previous.createdAt,
    updatedAt: Date.now(),
    photo: photo ?? undefined
  }

  return await storage.setItem(id, recipe)
})
