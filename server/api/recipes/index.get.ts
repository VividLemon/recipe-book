import type { RecipePageResponse } from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getRecipeTags } from '../../recipe-tags/service'
import { listRecipes } from '../../recipes/service'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event): Promise<RecipePageResponse> => {
  const query = await getValidatedQuery(event, recipes.list.query.parse)
  const [tags, page] = await Promise.all([getRecipeTags(), listRecipes(query)])

  return { ...page, items: page.items.map((el) => mapRecipeDataToWeb(el, tags)) }
})
