import { deserializeFormData } from '~/utils/serialization'
import {
  cleanupReplacedRecipePhotos,
  updateRecipe,
} from '../../recipes/service';
import { recipes } from '../../utils/validation'
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const [parsed, { id }] = await Promise.all([
    readMultipartFormData(event)
      .then((raw) => {
        if(!raw) throw noDataError
        return recipes.update.body.safeParseAsync(deserializeFormData(raw))
      })
      .then((result) => {
        if(result.error) throw validationError(result.error)
        return result.data
      }),

    getValidatedRouterParams(event, recipes.update.params.parse),
  ])

  const {newRecipe, previousRecipe} = await updateRecipe(id, parsed, user.id)

  // Cleanup previous recipe photos if a new cover image was uploaded
  if (parsed.coverImage) {
    event.waitUntil(cleanupReplacedRecipePhotos(previousRecipe, newRecipe).catch((e) => {
      consola.error('Cleanup previous photos exited with error:', e)
    }))
  }

  setResponseStatus(event, 204)
})
