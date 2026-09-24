import type { ReadRecipeResponse } from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getAllRecipes } from '../../recipes/service'
import { getRecipeTags } from '../../recipe-tags/service'

export default defineEventHandler(async () => {
  const [tags, items] = await Promise.all([getRecipeTags(), getAllRecipes()])

  return items
    .map((el) => mapRecipeDataToWeb(el, tags)) satisfies ReadRecipeResponse
})
