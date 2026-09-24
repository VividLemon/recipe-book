import Sharp, {type Sharp as SharpType, type ResizeOptions} from 'sharp'
import { v7 } from 'uuid'
import type { ImageFormatVariants, PhotosData, RecipeData } from '../../types/recipe'
import { photoError, unknownPhotoError } from '../utils/errors'
import { fileTypeFromBuffer } from 'file-type'
import { buildPhotoVariantKeys, buildStepPhotoKey, listImageVariantUrls } from '~/utils/photoVariants'
import { usePhotoFiles } from './repository'
import { useRecipeRepository } from '../recipes/repository'
import { useAppConfig } from '#imports'
import { consola } from 'consola'

// Utils
export const recipePhotoPrefix = 'recipe_photo_'
export const photoUrlPrefix = '/api/photos/'
const downsizedDimensions = {
  width: 200,
  height: 200
} as const
const getDefaultFileName = () => v7().replace(/-/g, '')
/**
 * The stored value for a photo is the public URL (`/api/photos/<key>`). This
 * strips that prefix back down to the raw storage key so it can be used with
 * the configured file engine.
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
export const deletePhoto = (nameOrUrl: string) => usePhotoFiles().remove(toStorageKey(nameOrUrl))

const listRecipePhotoUrls = (recipe: Pick<RecipeData, 'photos'>): string[] => [
  ...listImageVariantUrls(recipe.photos?.coverImage?.default),
  ...listImageVariantUrls(recipe.photos?.coverImage?.thumbnail),
  ...(recipe.photos?.stepsImages ?? [])
]

export const listRemovedRecipePhotoUrls = ({
  previous,
  next
}: {
  previous: Pick<RecipeData, 'photos'>
  next: Pick<RecipeData, 'photos'>
}) => {
  const nextUrls = new Set(listRecipePhotoUrls(next))
  return listRecipePhotoUrls(previous).filter((url) => !nextUrls.has(url))
}

export const deletePhotos = async (photos: string[]) =>
  Promise.all(photos.map((photo) => deletePhoto(photo)))

export const deleteRecipePhotos = async (recipeId: string) => {
  const item = await useRecipeRepository().get(recipeId)
  if (!item) throw notFoundError
  if (!item.photos) return
  await deletePhotos(listRecipePhotoUrls(item))
}

const applyResizeOptions = async ({
  sharp,
  opts
}: {
  sharp: SharpType
  opts: {
    resizeOpts?: ResizeOptions
    maximumDimensions?: Pick<ResizeOptions, 'width' | 'height'>
    preserveAspectRatio?: boolean
  }
}) => {
  const preserveAspectRatio = opts.preserveAspectRatio ?? true
  if (opts.resizeOpts)
    sharp.resize(
      confineDimensions({
        ...opts.resizeOpts,
        preserveAspectRatio
      })
    )

  if (!opts.maximumDimensions) return

  const data = await sharp.metadata()
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
    preserveAspectRatio?: boolean
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
    await usePhotoFiles().put(key, buffer)
    return { photo: toPhotoUrl(key) }
  } catch (e) {
    consola.error(e)
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
    const mappedKeys = {
      avif: { name: keys.avif, buffer: avifBuffer },
      webp: { name: keys.webp, buffer: webpBuffer },
      original: { name: keys.original, buffer: originalBuffer }
    } as Record<keyof ImageFormatVariants, {name: string; buffer: Buffer}>

    const writeResults = await Promise.allSettled(
      Object.values(mappedKeys).map(({ name, buffer }) => usePhotoFiles().put(name, buffer))
    )
    const writeFailure = writeResults.find((r) => r.status === 'rejected')
    if (writeFailure) {
      const cleanupResults = await Promise.allSettled(
        Object.values(mappedKeys).map(({ name }) => deletePhoto(toPhotoUrl(name)))
      )
      const cleanupFailures = cleanupResults.filter((r) => r.status === 'rejected')
      if (cleanupFailures.length > 0) consola.error('failed to clean up photo variants:', cleanupFailures)

      consola.error(writeFailure.reason)
      return { error: unknownPhotoError }
    }

    return {
      variants: {
        original: toPhotoUrl(keys.original),
        webp: toPhotoUrl(keys.webp),
        avif: toPhotoUrl(keys.avif)
      }
    }
  } catch (e) {
    consola.error(e)
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

  if (def.error || thumbnail.error) {
    const promises: Promise<void>[] = []
    promises.push(
      ...listImageVariantUrls(def.variants).map((url) =>
        deletePhoto(url).catch((e) => {
          consola.error('Failed to clean up cover image variant:', e)
        })
      )
    )
    promises.push(
      ...listImageVariantUrls(thumbnail.variants).map((url) =>
        deletePhoto(url).catch((e) => {
          consola.error('Failed to clean up thumbnail image variant:', e)
        })
      )
    )
    await Promise.all(promises)
    return { error: (def.error ?? thumbnail.error)! }
  }

  // This shouldn't happen. We checked for errors above.
  if (!def.variants || !thumbnail.variants) return { error: unknownPhotoError }

  return { photos: { default: def.variants, thumbnail: thumbnail.variants } }
}
