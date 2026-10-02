import { deserializeFormData } from '~/utils/serialization'
import { createRecipe } from '../../recipes/service'

export default defineEventHandler(async (event) => {
  const parsed = await
    (readMultipartFormData(event)
      .then((raw) => {
        if (!raw) throw noDataError
        return recipes.create.body.safeParseAsync(deserializeFormData(raw))
      })
      .then((result) => {
        if (result.error) throw validationError(result.error)
        return result.data
      }))

  const recipe = await createRecipe(parsed)
  setResponseStatus(event, 201)
  return { id: recipe.id }
})
