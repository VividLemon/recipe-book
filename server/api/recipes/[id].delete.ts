import { cleanupRecipePhotos, deleteRecipe } from '../../recipes/service'
import { recipes } from '../../utils/validation'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )
  event.waitUntil(cleanupRecipePhotos(id).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))

  await deleteRecipe(id)
  setResponseStatus(event, 204)
})
