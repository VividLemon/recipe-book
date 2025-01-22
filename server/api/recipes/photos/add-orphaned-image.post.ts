import type { CreateRecipePhotoRequest, Recipe } from '../../../../types/recipe'
import { deserializeFormData } from '../../../../utils/serialization'
import { maximumRecipeStepsPhotoDimensions } from '../../../../utils/shared'
import { processPhoto } from '../../../utils/photo'
import { recipePhotos } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const [raw, query] = await Promise.all([
    readMultipartFormData(event),
    getValidatedQuery(event, recipePhotos.createCover.query.parse)
  ])
  if (!raw) throw noDataError
  const parsed = deserializeFormData<CreateRecipePhotoRequest>(raw)
  const z = recipePhotos.createCover.body.safeParse(parsed)
  if (z.error) throw validationError(z.error)
  const { file } = z.data

  let previousRecipe: Recipe | null = null
  if (query?.id) {
    previousRecipe = await storage.getItem(query.id)
    if (!previousRecipe) throw notFoundError
  }

  const { photo, error } = await processPhoto(event, file, {
    maximumDimensions: maximumRecipeStepsPhotoDimensions,
    preserveAspectRatio: query?.preserveAspectRatio
  })
  if (error || !photo) throw error

  if (previousRecipe) {
    await storage.setItem(previousRecipe.id, {
      ...previousRecipe,
      photos: {
        ...previousRecipe.photos,
        stepsImages: [...(previousRecipe.photos?.stepsImages || []), photo]
      }
    })
  }

  setResponseStatus(event, 201)
  return { url: photo }
})
