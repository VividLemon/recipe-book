import type { ReadRecipeResponse } from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getAllRecipes, getRecipeTags } from '../../utils/shared'

export default defineEventHandler(async () => {
  const tagsPromise = getRecipeTags()
  const [tags, items] = await Promise.all([tagsPromise, getAllRecipes()])

  return items
    .filter((el) => el !== null)
    .map((el) => mapRecipeDataToWeb(el, tags)) satisfies ReadRecipeResponse
})
