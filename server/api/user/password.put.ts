import { updatePassword } from '../../users/service'
import { passwordUpdate } from '../../users/validation'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, passwordUpdate.parse)
  await updatePassword(user.id, body.oldPassword, body.newPassword)
  setResponseStatus(event, 204)
})
