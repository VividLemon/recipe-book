import { deserializeFormData } from '~/utils/serialization'
import { updateRecipe } from '../../recipes/service'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const [{ id }, raw] = await Promise.all([
    getValidatedRouterParams(event, recipes.update.params.parse),
    readMultipartFormData(event)
  ])
  if (!raw) throw noDataError
  const parsed = deserializeFormData(raw)
  const z = await recipes.update.body.safeParseAsync(parsed)
  if (z.error) throw validationError(z.error)
  await updateRecipe(id, z.data)
  setResponseStatus(event, 204)
})
