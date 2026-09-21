import Sharp, {type Sharp as SharpType, type ResizeOptions} from 'sharp'
import { v7 } from 'uuid'
import type { ImageFormatVariants, PhotosData, RecipeData } from '../../types/recipe'
import { photoError, unknownPhotoError } from './errors'
import { fileTypeFromBuffer } from 'file-type'
import { buildPhotoVariantKeys, buildStepPhotoKey, listImageVariantUrls } from '~/utils/photoVariants'
import { usePhotoStorage } from './storage/photos'
import { useAppConfig } from '#imports'
import { consola } from 'consola'

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
export const deletePhoto = (nameOrUrl: string) => usePhotoStorage().removeItem(toStorageKey(nameOrUrl))

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
  const storage = useRecipeStorage()
  const item = await storage.getItem(recipeId)
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
    await usePhotoStorage().setItemRaw(key, buffer)
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

    try {
      await Promise.all(
        Object.values(mappedKeys).map(({ name, buffer }) => usePhotoStorage().setItemRaw(name, buffer))
      )
    } catch (e) {
      const result = await Promise.allSettled(
        Object.values(mappedKeys).map(({name}) => deletePhoto(toPhotoUrl(name)))
      )
      const failures = result.filter((r) => r.status === 'rejected')
      if (failures.length > 0) consola.error('failed to clean up photo variants:', failures)

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

  try {
    if (def.error) throw def.error
    if (thumbnail.error) throw thumbnail.error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
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
    return { error: e }
  }

  // This shouldn't happen. We checked for errors above.
  if (!def.variants || !thumbnail.variants) return { error: unknownPhotoError }

  return { photos: { default: def.variants, thumbnail: thumbnail.variants } }
}
