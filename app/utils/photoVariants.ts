import type { ImageFormatVariants } from '../../types/recipe'

export type MaybeLegacyImageVariants = ImageFormatVariants | string | null | undefined
export const recipePhotoKeyPrefix = 'recipe_photo_v2'

export const normalizeImageVariants = (
  value: MaybeLegacyImageVariants
): ImageFormatVariants | null => {
  if (!value) return null
  if (typeof value === 'string') {
    return {
      original: value,
      webp: value,
      avif: value
    }
  }
  return value
}

export const listImageVariantUrls = (value: MaybeLegacyImageVariants): string[] => {
  const normalized = normalizeImageVariants(value)
  if (!normalized) return []
  return [normalized.original, normalized.webp, normalized.avif]
}

export const buildStepPhotoKey = (name: string, ext: string) =>
  `${recipePhotoKeyPrefix}/${name}/step/original.${ext.toLowerCase()}`

export const buildPhotoVariantKeys = ({
  baseName,
  role,
  originalExt
}: {
  baseName: string
  role: 'cover-default' | 'cover-thumbnail'
  originalExt: string
}): Record<keyof ImageFormatVariants, string> => ({
  original: `${recipePhotoKeyPrefix}/${baseName}/${role}/original.${originalExt.toLowerCase()}`,
  webp: `${recipePhotoKeyPrefix}/${baseName}/${role}/webp.webp`,
  avif: `${recipePhotoKeyPrefix}/${baseName}/${role}/avif.avif`
})
