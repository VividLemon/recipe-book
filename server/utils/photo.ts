import Sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { v4 } from 'uuid'
import type { Photo } from '../../types/recipe'
import { photoError } from './errors'

export type MultiPartData = Exclude<
  Awaited<ReturnType<typeof readMultipartFormData>>,
  undefined
>[number]
export type ProcessPhotoInput = {
  data: Buffer
  type: string
}

const allowedTypes = new Set(['JPEG', 'PNG', 'WebP'])
const downsizedDimensions = {
  width: 200,
  height: 200
} as const

export const processPhoto = async (
  input: ProcessPhotoInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
): Promise<
  | { photo: Photo; error?: ReturnType<typeof photoError> }
  | { photo?: Photo; error: ReturnType<typeof photoError> }
> => {
  const {
    picture: { storageDir }
  } = useRuntimeConfig(event)

  if (!input.type || !allowedTypes.has(input.type))
    return { error: photoError({ message: 'Invalid photo type' }) }

  const dir = await mkdir(storageDir, { recursive: true })
  if (!dir) return { error: photoError({ message: 'Invalid directory' }) }

  const ud = v4().replace(/-/g, '')
  const filename = `${dir}/${ud}.${input.type.toLowerCase()}`
  const thumbnail = `${dir}/${ud}-small.${input.type.toLowerCase()}`

  await Promise.all([
    Sharp(input.data).toFile(filename),
    Sharp(input.data).resize(downsizedDimensions).toFile(thumbnail)
  ])

  return { photo: { default: filename, thumbnail: thumbnail } }
}
