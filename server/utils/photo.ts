import Sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { v4 } from 'uuid'
import type { Photo } from '../../types/recipe'
import { photoError } from './errors'
import { isAbsolute, resolve } from 'node:path'

export type ProcessPhotoInput = {
  data: Buffer
  type: string
}

const downsizedDimensions = {
  width: 200,
  height: 200
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPhotoStorageDir = (event: any) => {
  const runtimeConfig = useRuntimeConfig(event)
  const storageDir = runtimeConfig.picture.storageDir

  return isAbsolute(storageDir)
    ? storageDir
    : resolve(process.cwd(), storageDir)
}

export const processPhoto = async (
  input: ProcessPhotoInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
): Promise<
  | { photo: Photo; error?: ReturnType<typeof photoError> }
  | { photo?: Photo; error: ReturnType<typeof photoError> }
> => {
  const runtimeConfig = useRuntimeConfig(event)
  const acceptedImageTypes = runtimeConfig.public.picture.acceptedImageTypes

  if (!input.type || !acceptedImageTypes.includes(input.type))
    return {
      error: photoError({
        message: `Invalid photo type. Expected ${acceptedImageTypes.join(', ')}. Got: ${input.type}`
      })
    }

  const dir = await mkdir(getPhotoStorageDir(event), { recursive: true })
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
