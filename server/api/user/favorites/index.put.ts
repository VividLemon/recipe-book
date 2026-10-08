import { getAccessibleRecipe } from '../../../recipes/service'
import { recipeNotFoundError } from '../../../recipes/errors'
import { setUserFavorite } from '../../../users/service'
import { favoriteUpdate } from '../../../users/validation'

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readValidatedBody(event, favoriteUpdate.parse)
  const recipe = await getAccessibleRecipe({ id: body.recipeId, userId: sessionUser.id })
  if (!recipe) throw recipeNotFoundError()

  return setUserFavorite({
    userId: sessionUser.id,
    recipeId: body.recipeId,
    favorite: body.favorite
  })
})
