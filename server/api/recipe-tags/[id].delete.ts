import { deleteRecipeTag } from '../../recipe-tags/service'
import { recipeTags } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipeTags.delete.params.parse
  )
  await deleteRecipeTag(id)
  setResponseStatus(event, 204)
})
