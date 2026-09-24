import { deserializeFormData } from '~/utils/serialization'
import { createRecipe } from '../../recipes/service'

export default defineEventHandler(async (event) => {
  const raw = await readMultipartFormData(event)
  if (!raw) throw noDataError
  const parsed = deserializeFormData(raw)
  const z = await recipes.create.body.safeParseAsync(parsed)
  if (z.error) throw validationError(z.error)
  await createRecipe(z.data)
  setResponseStatus(event, 201)
})
