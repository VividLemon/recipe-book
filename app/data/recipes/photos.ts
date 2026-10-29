import type { ImageFormatVariants, RecipeWeb } from '../../../types/recipe'
import { offlineCacheNames } from '../offline/cacheNames'

export type ImageFormat = keyof ImageFormatVariants

/**
 * Every photo URL the recipes display: cover (full size and thumbnail) and
 * step images. Covers render in a `<picture>`, so only the format this browser
 * picks is needed.
 */
export const recipePhotoUrls = (recipes: RecipeWeb[], format: ImageFormat) => {
  const urls = new Set<string>()
  for (const { photos } of recipes) {
    const cover = photos?.coverImage
    if (cover) {
      urls.add(cover.default[format])
      urls.add(cover.thumbnail[format])
    }
    for (const url of photos?.stepsImages ?? []) urls.add(url)
  }
  return [...urls]
}

// 1x1 images; decoding them tells which <source> type a <picture> will choose
const probes = {
  avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
  webp: 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
}
const canDecode = (src: string) => new Promise<boolean>((resolve) => {
  const image = new Image()
  image.onload = () => resolve(image.width > 0)
  image.onerror = () => resolve(false)
  image.src = src
})

export const detectImageFormat = async (): Promise<ImageFormat> => {
  if (await canDecode(probes.avif)) return 'avif'
  if (await canDecode(probes.webp)) return 'webp'
  return 'original'
}

/**
 * Makes the photo cache hold exactly `urls`: missing ones are downloaded a few
 * at a time, and photos no longer used (deleted or other users' recipes) are
 * removed so private images do not linger.
 */
export const syncPhotoCache = async (urls: string[], concurrency = 4) => {
  const cache = await caches.open(offlineCacheNames.photos)
  const wanted = new Set(urls.map((url) => new URL(url, location.origin).href))
  const cached = await cache.keys()
  await Promise.all(cached
    .filter((request) => !wanted.has(request.url))
    .map((request) => cache.delete(request)))

  const have = new Set(cached.map((request) => request.url))
  const queue = [...wanted].filter((url) => !have.has(url))
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      // A single missing photo should not stop the rest
      await cache.add(url).catch(() => {})
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
}
