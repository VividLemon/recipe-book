import { useRecipeStorage } from '../../utils/mongo'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.delete.params.parse
  )

  setResponseStatus(event, 204)
  await storage.del(id)
})
