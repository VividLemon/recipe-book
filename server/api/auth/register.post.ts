import { register } from '../../auth/validation'
import { publicUser, registerUser } from '../../users/service'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, register.parse)
  const user = await registerUser(body)
  await setUserSession(event, { user: publicUser(user) })
  setResponseStatus(event, 201)
  return { user: publicUser(user) }
})
