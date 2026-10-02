import type { RecipePageResponse } from '../../../types/recipe'
import { mapRecipeDataToWeb } from '../../utils/mappers'
import { getRecipeTags } from '../../recipe-tags/service'
import { listRecipes } from '../../recipes/service'
import { recipes } from '../../utils/validation'
import { useUserRepository } from '../../users/repository'

export default defineEventHandler(async (event): Promise<RecipePageResponse> => {
  const query = await getValidatedQuery(event, recipes.list.query.parse)
  const session = await getUserSession(event)
  let favoriteIds: string[] = []
  if (query.sort === 'favorite') {
    if (!session.user?.id) throw createError({ statusCode: 401, statusMessage: 'Login required' })
    const user = await useUserRepository().get(session.user.id)
    favoriteIds = user?.favorites ?? []
  }
  const [tags, page] = await Promise.all([
    getRecipeTags(),
    listRecipes(query, session.user?.id, favoriteIds)
  ])

  return { ...page, items: page.items.map((el) => mapRecipeDataToWeb(el, tags)) }
})
