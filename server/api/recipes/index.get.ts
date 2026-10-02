import type {
  ReadRecipePageResponse,
  RecipeListApiQuery
} from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getAllRecipes, getRecipeTags } from '../../utils/shared'
import {
  applyRecipeListQuery,
  mapRecipeListApiQueryToBackend
} from '../../utils/recipe-list'
import { recipes } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(
    event,
    recipes.read.query.parse
  ) as RecipeListApiQuery
  const [tags, items] = await Promise.all([getRecipeTags(), getAllRecipes()])
  const result = applyRecipeListQuery(
    items,
    mapRecipeListApiQueryToBackend(query)
  )

  return {
    items: result.items.map((item) => mapRecipeDataToWeb(item, tags)),
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
    nextPage: result.nextPage
  } satisfies ReadRecipePageResponse
})
