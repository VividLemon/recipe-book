import type { ReadRecipeResponse } from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getRecipeTags } from '../../recipe-tags/service'
import { useRecipeRepository } from '#server/recipes/repository.ts';

export default defineEventHandler(async () => {
  const [tags, items] = await Promise.all([getRecipeTags(), useRecipeRepository().list()])

  return items
    .map((el) => mapRecipeDataToWeb(el, tags)) satisfies ReadRecipeResponse
})
