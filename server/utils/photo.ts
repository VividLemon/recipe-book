import type { ResizeOptions } from 'sharp'
import Sharp from 'sharp'
import { v7 } from 'uuid'
import type { ImageFormatVariants, PhotosData } from '../../types/recipe'
import { photoError, unknownPhotoError } from './errors'
import { fileTypeFromBuffer } from 'file-type'
import { stringBooleanToBoolean } from '~/utils/shared'
import { buildPhotoVariantKeys, buildStepPhotoKey, listImageVariantUrls } from '~/utils/photoVariants'
import { usePhotoStorage } from './storage/photos'
import { useAppConfig } from '#imports'

// Utils
export const recipePhotoPrefix = 'recipe_photo_'
// Public route (see server/api/photos/[...name].get.ts) that serves photos
// back out of `usePhotoStorage()`, regardless of which driver backs it.
export const photoUrlPrefix = '/api/photos/'
const downsizedDimensions = {
  width: 200,
  height: 200
} as const
const getDefaultFileName = () => v7().replace(/-/g, '')
/**
 * The stored value for a photo is the public URL (`/api/photos/<key>`). This
 * strips that prefix back down to the raw storage key so it can be used with
 * `usePhotoStorage()`.
 */
const toStorageKey = (nameOrUrl: string) =>
  nameOrUrl.startsWith(photoUrlPrefix)
    ? nameOrUrl.slice(photoUrlPrefix.length)
    : nameOrUrl.replace(/^\/+/, '')
const toPhotoUrl = (key: string) => `${photoUrlPrefix}${key}`
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
const getValidatedPhotoType = async (input: Buffer) => {
  const appConfig = useAppConfig()
  const acceptedImageTypes = appConfig.picture.acceptedImageTypes

  const type = await fileTypeFromBuffer(input)
  if (!type || !acceptedImageTypes.includes(type.mime))
    return {
      error: photoError({
        message: `Invalid photo type. Expected ${acceptedImageTypes.join(', ')}. Got: ${type?.mime ?? 'unknown'}`
      })
    }
  return { type }
}

// Deleting
export const deletePhoto = async (nameOrUrl: string) => {
  await usePhotoStorage().removeItem(toStorageKey(nameOrUrl))
}

export const deleteRecipePhotos = async (recipeId: string) => {
  const storage = useRecipeStorage()
  const item = await storage.getItem(recipeId)
  if (!item) throw notFoundError
  if (!item.photos) return
  await Promise.all([
    ...(item.photos.coverImage
      ? [
          ...listImageVariantUrls(item.photos.coverImage.default).map(deletePhoto),
          ...listImageVariantUrls(item.photos.coverImage.thumbnail).map(deletePhoto)
        ]
      : []),
    ...(item.photos.stepsImages ?? []).map(deletePhoto)
  ])
}

const applyResizeOptions = async ({
  sharp,
  opts
}: {
  sharp: Sharp.Sharp
  opts: {
    resizeOpts?: ResizeOptions
    maximumDimensions?: Pick<ResizeOptions, 'width' | 'height'>
    preserveAspectRatio?: 'true' | 'false'
  }
}) => {
  if (opts.resizeOpts)
    sharp.resize(
      confineDimensions({
        ...opts.resizeOpts,
        preserveAspectRatio: stringBooleanToBoolean(opts.preserveAspectRatio ?? 'true')
      })
    )

  if (!opts.maximumDimensions) return

  const data = await sharp.metadata()
  const preserveAspectRatio = stringBooleanToBoolean(opts.preserveAspectRatio ?? 'true')
  let { width, height } = data

  if (width && opts.maximumDimensions.width !== undefined)
    width = Math.min(width, opts.maximumDimensions.width)

  if (height && opts.maximumDimensions.height !== undefined)
    height = Math.min(height, opts.maximumDimensions.height)

  if (preserveAspectRatio && width && height) {
    sharp.resize(confineDimensions({ width, height, preserveAspectRatio }))
  } else if (width || height) {
    sharp.resize({ width, height })
  }
}

// Processing
export const processPhoto = async (
  input: Buffer,
  opts: {
    name?: string
    resizeOpts?: ResizeOptions
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

    const name = opts.name || getDefaultFileName()
    const sharp = Sharp(input)
    await applyResizeOptions({ sharp, opts })
    const key = buildStepPhotoKey(name, type.ext)
    const buffer = await sharp.toBuffer()
    await usePhotoStorage().setItemRaw(key, buffer)
    return { photo: toPhotoUrl(key) }
  } catch (e) {
    console.error(e)
    return {
      error: unknownPhotoError
    }
  }
}

const processPhotoVariants = async (
  input: Buffer,
  opts: {
    baseName: string
    role: 'cover-default' | 'cover-thumbnail'
    resizeOpts?: ResizeOptions
  }
): Promise<
  | { variants: ImageFormatVariants; error?: ReturnType<typeof photoError> }
  | { variants?: ImageFormatVariants; error: ReturnType<typeof photoError> }
> => {
  try {
    const { error: typeError, type } = await getValidatedPhotoType(input)
    if (typeError) return { error: typeError }

    const sharp = Sharp(input)
    await applyResizeOptions({ sharp, opts })

    const [originalBuffer, webpBuffer, avifBuffer] = await Promise.all([
      sharp.clone().toBuffer(),
      sharp.clone().webp().toBuffer(),
      sharp.clone().avif().toBuffer()
    ])

    const keys = buildPhotoVariantKeys({
      baseName: opts.baseName,
      role: opts.role,
      originalExt: type.ext
    })

    try {
      await Promise.all([
        usePhotoStorage().setItemRaw(keys.original, originalBuffer),
        usePhotoStorage().setItemRaw(keys.webp, webpBuffer),
        usePhotoStorage().setItemRaw(keys.avif, avifBuffer)
      ])
    } catch (e) {
      await Promise.all([
        deletePhoto(toPhotoUrl(keys.original)).catch(console.error),
        deletePhoto(toPhotoUrl(keys.webp)).catch(console.error),
        deletePhoto(toPhotoUrl(keys.avif)).catch(console.error)
      ])
      throw e
    }

    return {
      variants: {
        original: toPhotoUrl(keys.original),
        webp: toPhotoUrl(keys.webp),
        avif: toPhotoUrl(keys.avif)
      }
    }
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
  const defaultBaseName = `${name}-cover-default`
  const thumbnailBaseName = `${name}-cover-thumbnail`

  const [def, thumbnail] = await Promise.all([
    processPhotoVariants(input, {
      baseName: defaultBaseName,
      role: 'cover-default'
    }),
    processPhotoVariants(input, {
      baseName: thumbnailBaseName,
      role: 'cover-thumbnail',
      resizeOpts: downsizedDimensions
    })
  ])

  try {
    if (def.error) throw def.error
    if (thumbnail.error) throw thumbnail.error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const promises: Promise<void>[] = []
    promises.push(
      ...listImageVariantUrls(def.variants).map((url) =>
        deletePhoto(url).catch(console.error)
      )
    )
    promises.push(
      ...listImageVariantUrls(thumbnail.variants).map((url) =>
        deletePhoto(url).catch(console.error)
      )
    )
    await Promise.all(promises)
    return { error: e }
  }

  // This shouldn't happen. We checked for errors above.
  if (!def.variants || !thumbnail.variants) return { error: unknownPhotoError }

  return { photos: { default: def.variants, thumbnail: thumbnail.variants } }
}
