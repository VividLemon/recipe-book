import { useUserRepository } from '../../../users/repository'

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const user = await useUserRepository().get(sessionUser.id)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Account no longer exists' })
  return user.favorites
})
