import { getAccessibleRecipe } from '../../../recipes/service'
import { recipeNotFoundError } from '../../../recipes/errors'
import { useUserRepository } from '../../../users/repository'
import { accountMissingError } from '../../../users/errors'
import { favoriteUpdate } from '../../../users/validation'

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readValidatedBody(event, favoriteUpdate.parse)
  const [user, recipe] = await Promise.all([
    useUserRepository().get(sessionUser.id),
    getAccessibleRecipe(body.recipeId, sessionUser.id)
  ])
  if (!user) throw accountMissingError()
  if (!recipe) throw recipeNotFoundError()

  const favorites = new Set(user.favorites)
  if (body.favorite) favorites.add(body.recipeId)
  else favorites.delete(body.recipeId)
  user.favorites = [...favorites]
  await useUserRepository().set(user)
  return user.favorites
})
