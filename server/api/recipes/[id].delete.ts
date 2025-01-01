import { useRecipeStorage } from '../../utils/mongo'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )

  const deletePreviousPhotos = async () => {
    // const recipe = await storage.getItem(id)
    // TODO implement this function
  }

  await Promise.all([deletePreviousPhotos(), storage.del(id)])
  setResponseStatus(event, 204)
})
