import type { ResizeOptions } from 'sharp'
import Sharp from 'sharp'
import { v7 } from 'uuid'
import type { PhotosData } from '../../types/recipe'
import { noPhotoDirectoryError, photoError, unknownPhotoError } from './errors'
import { fileTypeFromBuffer } from 'file-type'
import { isAbsolute, resolve } from 'node:path'
import { unlink } from 'node:fs/promises'
import { stringBooleanToBoolean } from '~/utils/shared'
import {useAppConfig} from "#imports";

// Utils
export const recipePhotoPrefix = 'recipe_photo_'
const downsizedDimensions = {
  width: 200,
  height: 200
} as const
const getDefaultFileName = () => v7().replace(/-/g, '')
/**
 * If preserveAspectRatio is enabled (default), the function will ensure the aspect ratio is maintained with width taking precedence over height.
 */
const confineDimensions = ({
  width,
  height,
  preserveAspectRatio
}: ResizeOptions & { preserveAspectRatio: boolean }) => {
  if (!preserveAspectRatio) return { width, height }
  if (!width && !height) return {}
  if (!width) {
    return { width: undefined, height: height }
  } else if (!height) {
    return { width: width, height: undefined }
  }
  if (width > height) {
    return { width: width, height: undefined }
  } else {
    return { width: undefined, height: height }
  }
}

// Validation
export const getValidatedPhotoStorageDir = () => {
  const appConfig = useAppConfig()
  const storageDir = appConfig.public.picture.storageDir

  const toAbsolute = (path: string) => resolve(process.cwd(), path)

  const dir = isAbsolute(storageDir) ? storageDir : toAbsolute(storageDir)
  if (!dir) return { error: noPhotoDirectoryError }
  return { dir }
}

const getValidatedPhotoType = async (input: Buffer) => {
  const appConfig = useAppConfig()
  const acceptedImageTypes = appConfig.public.picture.acceptedImageTypes

  const type = await fileTypeFromBuffer(input)
  if (!type || !acceptedImageTypes.includes(type.ext))
    return {
      error: photoError({
        message: `Invalid photo type. Expected ${acceptedImageTypes.join(', ')}. Got: ${type}`
      })
    }
  return { type }
}

// Deleting
export const deletePhoto = async (name: string) => {
  const { dir, error } = getValidatedPhotoStorageDir()
  if (error) throw error
  await unlink(`${dir}/${name}`)
}

export const deleteRecipePhotos = async (recipeId: string) => {
  const storage = useRecipeStorage()
  const item = await storage.getItem(recipeId)
  if (!item) throw notFoundError
  if (!item.photos) return
  await Promise.all([
    ...(item.photos.coverImage
      ? [
          deletePhoto(item.photos.coverImage.default),
          deletePhoto(item.photos.coverImage.thumbnail)
        ]
      : []),
    ...(item.photos.stepsImages ?? []).map(deletePhoto)
  ])
}

// Processing
export const processPhoto = async (
  input: Buffer,
  opts: {
    name?: string
    resizeOpts?: Sharp.ResizeOptions
    maximumDimensions?: Pick<ResizeOptions, 'width' | 'height'>
    preserveAspectRatio?: 'true' | 'false'
  } = {}
): Promise<
  | { photo: string; error?: ReturnType<typeof photoError> }
  | { photo?: string; error: ReturnType<typeof photoError> }
> => {
  try {
    const { error: typeError, type } = await getValidatedPhotoType(input)
    if (typeError) return { error: typeError }

    const { dir, error: dirError } = getValidatedPhotoStorageDir()
    if (dirError) return { error: dirError }

    const name = opts.name || getDefaultFileName()

    const sharp = Sharp(input)
    if (opts.resizeOpts)
      sharp.resize(
        confineDimensions({
          ...opts.resizeOpts,
          preserveAspectRatio: stringBooleanToBoolean(
            opts.preserveAspectRatio ?? 'true'
          )
        })
      )

    const resizeWithinMaximumBounds = async () => {
      if (!opts.maximumDimensions) return

      const data = await sharp.metadata()
      const preserveAspectRatio = stringBooleanToBoolean(
        opts.preserveAspectRatio ?? 'true'
      )
      let { width, height } = data

      if (width && width > (opts.maximumDimensions.width ?? Infinity))
        width = opts.maximumDimensions.width

      if (height && height > (opts.maximumDimensions.height ?? Infinity))
        height = opts.maximumDimensions.height

      if (preserveAspectRatio && width && height) {
        if (width >= height) {
          height = undefined
        } else {
          width = undefined
        }
      }

      if (width || height) {
        sharp.resize(confineDimensions({ width, height, preserveAspectRatio }))
      } else {
        sharp.resize({ width, height })
      }
    }
    await resizeWithinMaximumBounds()
    const fileName = `/${recipePhotoPrefix}${name}.${type.ext.toLowerCase()}`
    await sharp.toFile(`${dir}${fileName}`)
    return { photo: fileName }
  } catch (e) {
    console.error(e)
    return {
      error: unknownPhotoError
    }
  }
}

export const processPhotoWithThumbnail = async (
  input: Buffer,
  opts: { name?: string } = {}
): Promise<
  | { photos: PhotosData['coverImage']; error?: ReturnType<typeof photoError> }
  | { photos?: PhotosData['coverImage']; error: ReturnType<typeof photoError> }
> => {
  const name = opts.name || getDefaultFileName()
  const smallName = `${name}-small`

  const [def, thumbnail] = await Promise.all([
    processPhoto(input, { name }),
    processPhoto(input, {
      name: smallName,
      resizeOpts: downsizedDimensions
    })
  ])

  try {
    if (def.error) throw def.error
    if (thumbnail.error) throw thumbnail.error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const promises: Promise<void>[] = []
    if (def.photo)
      promises.push(deletePhoto(def.photo).catch(console.error))
    if (thumbnail.photo)
      promises.push(deletePhoto(thumbnail.photo).catch(console.error))
    await Promise.all(promises)
    return { error: e }
  }

  // This shouldn't happen. We checked for errors above.
  if (!def.photo || !thumbnail.photo) return { error: unknownPhotoError }

  return { photos: { default: def.photo, thumbnail: thumbnail.photo } }
}
