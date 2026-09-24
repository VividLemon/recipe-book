import { useRecipeRepository } from '../../recipes/repository'
import { deleteRecipePhotos } from '../../photos/operations'
import { recipes } from '../../utils/validation'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )
  const storage = useRecipeRepository()

  event.waitUntil(deleteRecipePhotos(id).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))

  await storage.remove(id)
  setResponseStatus(event, 204)
})
