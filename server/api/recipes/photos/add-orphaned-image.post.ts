import type { CreateRecipePhotoRequest } from '../../../../types/recipe'
import { deserializeFormData } from '../../../../utils/serialization'
import { maximumRecipeStepsPhotoDimensions } from '../../../../utils/shared'
import { processPhoto } from '../../../utils/photo'
import { recipePhotos } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const [raw, query] = await Promise.all([
    readMultipartFormData(event),
    getValidatedQuery(event, recipePhotos.createCover.query.parse)
  ])
  if (!raw) throw noDataError
  const parsed = deserializeFormData<CreateRecipePhotoRequest>(raw)
  const z = recipePhotos.createCover.body.safeParse(parsed)
  if (z.error) throw validationError(z.error)
  const { file } = z.data

  const { photo, error } = await processPhoto(event, file, {
    maximumDimensions: maximumRecipeStepsPhotoDimensions,
    preserveAspectRatio: query?.preserveAspectRatio
  })
  if (error || !photo) throw error

  setResponseStatus(event, 201)
  return { url: photo }
})
