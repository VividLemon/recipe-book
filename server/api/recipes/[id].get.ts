import { recipeTagIdToRecipeTag } from '../../../utils/recipe'
import { useRecipeStorage } from '../../utils/mongo'
import { getRecipeTags } from '../../utils/shared'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storage = useRecipeStorage()
  const { id } = await getValidatedRouterParams(
    event,
    recipes.show.params.parse
  )
  const [item, tags] = await Promise.all([storage.getItem(id), getRecipeTags()])
  return item
    ? {
        ...item,
        tags: recipeTagIdToRecipeTag(item.tags, tags)
      }
    : null
})
