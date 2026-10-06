import { useUserRepository } from '../../../users/repository'
import { accountMissingError } from '../../../users/errors'

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const user = await useUserRepository().get(sessionUser.id)
  if (!user) throw accountMissingError()
  return user.favorites
})
