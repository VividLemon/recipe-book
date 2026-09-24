import { photoUrlPrefix, recipePhotoPrefix } from '../../../photos/service'
import { usePhotoFiles } from '../../../photos/repository'
import { getAllRecipes } from '../../../utils/shared'
import { listImageVariantUrls } from '~/utils/photoVariants'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const promise = async () => {
    try {
      const recipes = await getAllRecipes()
      const allImages = new Set(
        recipes.flatMap((el) => [
          ...listImageVariantUrls(el?.photos?.coverImage?.default),
          ...listImageVariantUrls(el?.photos?.coverImage?.thumbnail),
          ...(el?.photos?.stepsImages ?? [])
        ])
      )
      const storage = usePhotoFiles()
      const keys = await storage.list()
      await Promise.all(
        keys.map(async (key) => {
          const url = `${photoUrlPrefix}${key}`
          if (key.startsWith(recipePhotoPrefix) && !allImages.has(url)) {
            await storage.remove(key)
          }
        })
      )
    } catch (e) {
      consola.error('Error cleaning up photos:', e)
    }
  }
  event.waitUntil(promise())
  setResponseStatus(event, 204)
})
