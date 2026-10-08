import { updatePassword } from '../../users/service'
import { passwordUpdate } from '../../users/validation'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, passwordUpdate.parse)
  await updatePassword({
    userId: user.id,
    oldPassword: body.oldPassword,
    newPassword: body.newPassword
  })
  setResponseStatus(event, 204)
})
