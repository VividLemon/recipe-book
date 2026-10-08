import { deserializeFormData } from '~/utils/serialization'
import { createRecipe } from '../../recipes/service'
import { getRecipeTags } from '../../recipe-tags/service'
import { mapRecipeDataToWeb } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
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

  const created = await createRecipe({ input: parsed, userId: user.id })
  setResponseStatus(event, 201)
  return mapRecipeDataToWeb(created, await getRecipeTags())
})
