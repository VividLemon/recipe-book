import { useRecipeStorage } from '../../utils/mongo'
import { deleteRecipePhotos } from '../../utils/photo'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )

  event.waitUntil(deleteRecipePhotos(event, id))

  await storage.del(id)
  setResponseStatus(event, 204)
})
