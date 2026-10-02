import { recipes } from '../../utils/validation'
import { consola } from 'consola'
import { deleteRecipePhotos } from '#server/photos/operations.ts';
import { useRecipeRepository } from '#server/recipes/repository.ts';

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )
  event.waitUntil(deleteRecipePhotos(id).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))

  await useRecipeRepository().remove(id)
  setResponseStatus(event, 204)
})
