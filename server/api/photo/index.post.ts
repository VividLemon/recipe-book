import { photo as photoValidator } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const raw = await readMultipartFormData(event)
  const z = photoValidator.create.body.safeParse(raw)
  if (z.error) throw validationError(z.error)
  const [file] = z.data
  const { photo, error } = await processPhoto(file, event)
  if (error || !photo) throw error

  setResponseStatus(event, 201)
  return { url: photo }
})
