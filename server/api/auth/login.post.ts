import { invalidCredentialsError } from '../../auth/errors'
import { login } from '../../auth/validation'
import { findUserByEmail, publicUser } from '../../users/service'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, login.parse)
  const user = await findUserByEmail(body.email)
  if (!user || !await verifyPassword(user.passwordHash, body.password)) {
    throw invalidCredentialsError()
  }
  await setUserSession(event, { user: publicUser(user) })
  return { user: publicUser(user) }
})
