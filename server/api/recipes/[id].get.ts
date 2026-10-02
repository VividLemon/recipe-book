import { getRecipeTags } from '../../recipe-tags/service'
import { recipes } from '../../utils/validation'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getAccessibleRecipe } from '../../recipes/service'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(
    event,
    recipes.show.params.parse
  )
  const session = await getUserSession(event)
  const [item, tags] = await Promise.all([
    getAccessibleRecipe(id, session.user?.id),
    getRecipeTags()
  ])
  return item ? mapRecipeDataToWeb(item, tags) : null
})
