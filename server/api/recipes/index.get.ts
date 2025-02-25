import type { ReadRecipeResponse } from '../../../types/recipe'
import { recipeTagIdToRecipeTag } from '../../../utils/recipe'
import { getAllRecipes, getRecipeTags } from '../../utils/shared'

export default defineEventHandler(async () => {
  const tagsPromise = getRecipeTags()
  const [tags, items] = await Promise.all([tagsPromise, getAllRecipes()])

  return items
    .filter((el) => el !== null)
    .map(
      (el) =>
        ({
          ...el,
          tags: recipeTagIdToRecipeTag(el.tags, tags)
        }) satisfies ReadRecipeResponse[number]
    )
})
