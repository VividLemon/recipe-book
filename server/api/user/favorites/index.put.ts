import { object, boolean, uuidv7 } from 'zod'
import { getAccessibleRecipe } from '../../../recipes/service'
import { useUserRepository } from '../../../users/repository'

const bodySchema = object({
  recipeId: uuidv7(),
  favorite: boolean()
})

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const [user, recipe] = await Promise.all([
    useUserRepository().get(sessionUser.id),
    getAccessibleRecipe(body.recipeId, sessionUser.id)
  ])
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Account no longer exists' })
  if (!recipe) throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })

  const favorites = new Set(user.favorites)
  if (body.favorite) favorites.add(body.recipeId)
  else favorites.delete(body.recipeId)
  user.favorites = [...favorites]
  await useUserRepository().set(user)
  return user.favorites
})
