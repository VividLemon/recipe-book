import { useRecipeStorage } from '../../utils/mongo'
import { getRecipeTags } from '../../utils/shared'
import { recipes } from '../../utils/validation'
import { mapRecipeDataToWeb } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.show.params.parse
  )
  const [item, tags] = await Promise.all([storage.getItem(id), getRecipeTags()])
  return item ? mapRecipeDataToWeb(item, tags) : null
})
