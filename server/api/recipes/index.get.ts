import type { ReadRecipeResponse } from '../../../types/recipe'
import type { RecipeListQuery } from '../../../types/listQuery'
import { mapRecipeDataToWeb, mapRecipeListQueryToDocumentQuery } from '../../utils/mappers'
import { recipes } from '../../utils/validation'
import { getRecipeTags } from '../../recipe-tags/service'
import { useRecipeRepository } from '#server/recipes/repository.ts';

export default defineEventHandler(async (event) => {
  const { difficulty, ...rest } = await getValidatedQuery(event, recipes.read.query.parse)
  const query: RecipeListQuery = { ...rest, filter: difficulty ? { difficulty } : undefined }

  const [tags, page] = await Promise.all([
    getRecipeTags(),
    useRecipeRepository().page(mapRecipeListQueryToDocumentQuery(query))
  ])

  setHeader(event, 'X-Total-Count', page.total)
  return page.items
    .map((el) => mapRecipeDataToWeb(el, tags)) satisfies ReadRecipeResponse
})
