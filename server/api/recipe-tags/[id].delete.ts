import { useRecipeTagsRepository } from '../../recipe-tags/repository'
import { recipeTags } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipeTags.delete.params.parse
  )
  const storage = useRecipeTagsRepository()

  await storage.remove(id)
  setResponseStatus(event, 204)
})
