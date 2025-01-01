import Sharp from 'sharp'
import { v4 } from 'uuid'
import type { Photo } from '../../types/recipe'
import { photoError } from './errors'
import { fileTypeFromBuffer } from 'file-type'
import { isAbsolute, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'

const recipePhotoPrefix = 'recipe_photo_'

const downsizedDimensions = {
  width: 200,
  height: 200
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPhotoStorageDir = (event: any) => {
  const runtimeConfig = useRuntimeConfig(event)
  const storageDir = runtimeConfig.picture.storageDir

  return isAbsolute(storageDir) ? storageDir : toAbsolute(storageDir)
}

const toAbsolute = (path: string) => resolve(process.cwd(), path)

export const processPhoto = async (
  input: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
): Promise<
  | { photo: Photo; error?: ReturnType<typeof photoError> }
  | { photo?: Photo; error: ReturnType<typeof photoError> }
> => {
  const runtimeConfig = useRuntimeConfig(event)
  const acceptedImageTypes = runtimeConfig.public.picture.acceptedImageTypes

  const type = await fileTypeFromBuffer(input)
  if (!type || !acceptedImageTypes.includes(type.ext))
    return {
      error: photoError({
        message: `Invalid photo type. Expected ${acceptedImageTypes.join(', ')}. Got: ${type}`
      })
    }

  const dir = getPhotoStorageDir(event)
  if (!dir)
    return {
      error: photoError({
        message: 'Server Error: Invalid directory',
        statusCode: 500
      })
    }
  await mkdir(dir, { recursive: true })

  const ud = v4().replace(/-/g, '')
  const largeName = `/${recipePhotoPrefix}${ud}.${type.ext.toLowerCase()}`
  const smallName = `/${recipePhotoPrefix}${ud}-small.${type.ext.toLowerCase()}`

  try {
    await Promise.all([
      Sharp(input).toFile(`${dir}${largeName}`),
      Sharp(input).resize(downsizedDimensions).toFile(`${dir}${smallName}`)
    ])
  } catch (e) {
    console.error(e)
    return {
      error: photoError({
        statusCode: 500,
        message: 'Server Error: Could not process photo'
      })
    }
  }

  return { photo: { default: largeName, thumbnail: smallName } }
}
