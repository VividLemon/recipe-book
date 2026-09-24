import type { RecipeData } from '../../../../types/recipe'
import { deserializeFormData } from '~/utils/serialization'
import { maximumRecipeStepsPhotoDimensions, stringBooleanToBoolean } from '~/utils/shared'
import { processPhoto } from '../../../photos/operations'
import { recipePhotos } from '../../../utils/validation'
import { useRecipeRepository } from '../../../recipes/repository'

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
  const storage = useRecipeRepository()

  let previousRecipe: RecipeData | null = null
  if (query?.id) {
    previousRecipe = await storage.get(query.id)
    if (!previousRecipe) throw notFoundError
  }

  const { photo, error } = await processPhoto(file, {
    maximumDimensions: maximumRecipeStepsPhotoDimensions,
    preserveAspectRatio: query?.preserveAspectRatio ? stringBooleanToBoolean(query?.preserveAspectRatio) : undefined
  })
  if (error || !photo) throw error

  if (previousRecipe) {
    await storage.set({
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
