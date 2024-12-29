import { useRecipeStorage } from '../../utils/mongo'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.show.params.parse
  )
  return await storage.getItem(id)
})
