import type { CreateRecipeRequest, Recipe } from '../../../types/recipe'
import { deserializeFormData } from '../../../utils/serialization'
import { useRecipeStorage } from '../../utils/mongo'
import { processPhoto } from '../../utils/photo'
import { v4 } from 'uuid'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const raw = await readMultipartFormData(event)
  if (!raw) throw noDataError
  const parsed = deserializeFormData<CreateRecipeRequest>(raw)
  const z = recipes.create.body.safeParse(parsed)
  if (z.error) throw validationError(z.error)
  const { photo: file, ...rest } = z.data

  const { photo, error } = file ? await processPhoto(file, event) : {}
  if (error) throw error

  const id = v4()
  const recipe: Recipe = {
    ...rest,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photo: photo ?? undefined,
    steps: sanitizeHtml(rest.steps),
    id
  }

  await storage.setItem(id, recipe)
  setResponseStatus(event, 201)
  return recipe
})
