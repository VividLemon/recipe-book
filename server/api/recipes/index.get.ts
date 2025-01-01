import type { ReadRecipeResponse } from '../../../types/recipe'
import { useRecipeStorage } from '../../utils/mongo'
import { getRecipeTags, recipeTagIdToRecipeTag } from '../../utils/shared'

export default defineEventHandler(async () => {
  const storage = useRecipeStorage()
  const tagsPromise = getRecipeTags()
  const keys = await storage.getKeys()
  const [tags, ...items] = await Promise.all([
    tagsPromise,
    ...keys.map((el) => storage.getItem(el))
  ])

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
