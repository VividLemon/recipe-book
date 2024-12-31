import { getPhotoStorageDir } from '../../utils/photo'
import { rm } from 'node:fs/promises'
import { photo } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const storageDir = getPhotoStorageDir(event)
  const { id } = await getValidatedRouterParams(
    event,
    photo.delete.params.parse
  )
  await rm(`${storageDir}/${id}`)
  setResponseStatus(event, 204)
})
