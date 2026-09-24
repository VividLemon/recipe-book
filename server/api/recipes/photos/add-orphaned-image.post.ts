import { deserializeFormData } from '~/utils/serialization'
import { maximumRecipeStepsPhotoDimensions, stringBooleanToBoolean } from '~/utils/shared'
import { processPhoto } from '../../../photos/operations'
import { recipePhotos } from '../../../utils/validation'
import { addStepPhoto, getRecipe } from '../../../recipes/service'

export default defineEventHandler(async (event) => {
  const [raw, query] = await Promise.all([
    readMultipartFormData(event),
    getValidatedQuery(event, recipePhotos.createCover.query.parse)
  ])
  if (!raw) throw noDataError
  const parsed = deserializeFormData(raw)
  const z = await recipePhotos.createCover.body.safeParseAsync(parsed)
  if (z.error) throw validationError(z.error)
  const { file } = z.data
  let previousRecipe: Awaited<ReturnType<typeof getRecipe>> = null
  if (query?.id) {
    previousRecipe = await getRecipe(query.id)
    if (!previousRecipe) throw notFoundError
  }

  const { photo, error } = await processPhoto(file, {
    maximumDimensions: maximumRecipeStepsPhotoDimensions,
    preserveAspectRatio: query?.preserveAspectRatio ? stringBooleanToBoolean(query?.preserveAspectRatio) : undefined
  })
  if (error || !photo) throw error

  if (previousRecipe) {
    await addStepPhoto(previousRecipe, photo)
  }

  setResponseStatus(event, 201)
  return { url: photo }
})
