import { recipes } from '../../utils/validation'
import { consola } from 'consola'
import { deleteRecipePhotos } from '#server/photos/operations.ts';
import { deleteRecipe } from '#server/recipes/service.ts';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )
  event.waitUntil(deleteRecipePhotos(id).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))

  await deleteRecipe(id, user.id)
  setResponseStatus(event, 204)
})
