import { email, object, string } from 'zod'
import { findUserByEmail, publicUser } from '../../users/service'

const bodySchema = object({
  email: email(),
  password: string().min(1).max(128)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const user = await findUserByEmail(body.email)
  if (!user || !await verifyPassword(user.passwordHash, body.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }
  await setUserSession(event, { user: publicUser(user) })
  return { user: publicUser(user) }
})
