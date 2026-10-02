import { object, string } from 'zod'
import { updatePassword } from '../../users/service'

const bodySchema = object({
  oldPassword: string().min(1).max(128),
  newPassword: string().min(8).max(128),
  confirmPassword: string().min(8).max(128)
}).refine((body) => body.newPassword === body.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  await updatePassword(user.id, body.oldPassword, body.newPassword)
  setResponseStatus(event, 204)
})
