import { useRecipeStorage } from '../../utils/storage'
import { deleteRecipePhotos } from '../../utils/photo'
import { recipes } from '../../utils/validation'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )

  event.waitUntil(deleteRecipePhotos(id).catch((e) => {
    consola.error('Cleanup deleted recipe photos exited with error:', e)
  }))

  await storage.removeItem(id)
  setResponseStatus(event, 204)
})
