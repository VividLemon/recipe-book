import { useRecipeTagsStorage } from '../../utils/mongo'
import { recipeTags } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeTagsStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipeTags.delete.params.parse
  )

  await storage.removeItem(id)
  setResponseStatus(event, 204)
})
