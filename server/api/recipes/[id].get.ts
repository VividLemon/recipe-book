import { useRecipeRepository } from '../../recipes/repository'
import { getRecipeTags } from '../../recipe-tags/service'
import { recipes } from '../../utils/validation'
import { mapRecipeDataToWeb } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const storage = useRecipeRepository()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.show.params.parse
  )
  const [item, tags] = await Promise.all([storage.get(id), getRecipeTags()])
  return item ? mapRecipeDataToWeb(item, tags) : null
})
