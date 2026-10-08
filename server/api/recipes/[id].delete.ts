import { recipes } from '../../utils/validation'
import { consola } from 'consola'
import { deleteRecipePhotoData } from '#server/photos/operations.ts';
import { deleteRecipe } from '#server/recipes/service.ts';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )
  const deletedRecipe = await deleteRecipe({ id, userId: user.id })
  event.waitUntil(deleteRecipePhotoData(deletedRecipe).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))
  setResponseStatus(event, 204)
})
