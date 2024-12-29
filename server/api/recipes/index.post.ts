import type { Recipe } from '../../../types/recipe'
import { noDataError, validationError } from '../../utils/errors'
import { useRecipeStorage } from '../../utils/mongo'
import { processPhoto } from '../../utils/photo'
import { parseMultipartFormDataToRecipe, recipes } from '../../utils/validation'
import { v4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const raw = await readMultipartFormData(event)

  if (!raw) throw noDataError
  const obj = raw.reduce(
    parseMultipartFormDataToRecipe,
    {} as Record<string, unknown>
  )
  const z = recipes.create.body.safeParse(obj)
  if (z.error) throw validationError(z.error)
  const { photo: file, ...rest } = z.data

  const { photo, error } = file ? await processPhoto(file, event) : {}
  if (error) throw error

  const recipe: Recipe = {
    ...rest,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photo: photo ?? undefined,
    id: v4()
  }

  setResponseStatus(event, 201)
  await storage.setItem(recipe.name, recipe)
})
