import type { CreatePhotoRequest } from '../../../types/photo'
import { deserializeFormData } from '../../../utils/serialization'
import { photos } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const raw = await readMultipartFormData(event)
  if (!raw) throw noDataError
  const parsed = deserializeFormData<CreatePhotoRequest>(raw)
  const z = photos.create.body.safeParse(parsed)
  if (z.error) throw validationError(z.error)
  const { file } = z.data

  const { photo, error } = await processPhoto(file, event)
  if (error || !photo) throw error

  setResponseStatus(event, 201)
  return { url: photo }
})
