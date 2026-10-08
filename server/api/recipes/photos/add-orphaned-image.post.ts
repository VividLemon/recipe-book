import { deserializeFormData } from '~/utils/serialization'
import { stringBooleanToBoolean } from '~/utils/shared'
import { recipePhotos } from '../../../utils/validation'
import {
  addOrphanedStepPhoto,
} from '../../../recipes/service';
import { useRecipeRepository } from '../../../recipes/repository'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const [parsed, query] = await Promise.all([
    readMultipartFormData(event)
      .then((raw) => {
        if (!raw) throw noDataError
        return recipePhotos.createCover.body.safeParseAsync(deserializeFormData(raw))
      })
      .then((result) => {
        if (result.error) throw validationError(result.error)
        return result.data
      }),

    getValidatedQuery(event, recipePhotos.createCover.query.parseAsync)
  ])

  if (query?.id) {
    const recipe = await useRecipeRepository().findOne({ id: query.id })
    if (!recipe || recipe.ownerId !== user.id) throw notFoundError
  }

  const photoUrl = await addOrphanedStepPhoto({
    file: parsed.file,
    recipeId: query?.id,
    preserveAspectRatio: query?.preserveAspectRatio ? stringBooleanToBoolean(query.preserveAspectRatio) : undefined,
  })

  setResponseStatus(event, 201)
  return { url: photoUrl }
})
