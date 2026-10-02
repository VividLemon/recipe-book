import { email, object, string } from 'zod'
import { findUserByEmail, findUserByUsername, publicUser, registerUser } from '../../users/service'

const bodySchema = object({
  username: string().trim().min(2).max(40),
  email: email(),
  password: string().min(8).max(128)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  if (await findUserByEmail(body.email) || await findUserByUsername(body.username)) {
    throw createError({ statusCode: 409, statusMessage: 'Username or email is already registered' })
  }

  const user = await registerUser(body)
  await setUserSession(event, { user: publicUser(user) })
  setResponseStatus(event, 201)
  return { user: publicUser(user) }
})
