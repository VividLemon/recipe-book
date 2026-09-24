import { useRecipeTagsRepository } from '../../recipe-tags/repository'
import { recipeTags } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeTagsRepository()
  const { id } = await getValidatedRouterParams(
    event,
    recipeTags.delete.params.parse
  )

  await storage.remove(id)
  setResponseStatus(event, 204)
})
