import { photoUrlPrefix, recipePhotoPrefix } from '../../../utils/photo'
import { usePhotoStorage } from '../../../utils/storage/photos'
import { getAllRecipes } from '../../../utils/shared'

export default defineEventHandler(async (event) => {
  const promise = async () => {
    try {
      const recipes = await getAllRecipes()
      const allImages = new Set(
        recipes.flatMap((el) => [
          ...Object.values(el?.photos?.coverImage ?? {}),
          ...(el?.photos?.stepsImages ?? [])
        ])
      )
      const storage = usePhotoStorage()
      const keys = await storage.getKeys()
      await Promise.all(
        keys.map((key) => {
          const url = `${photoUrlPrefix}${key}`
          if (key.startsWith(recipePhotoPrefix) && !allImages.has(url)) {
            return storage.removeItem(key)
          }
          return Promise.resolve()
        })
      )
    } catch (e) {
      console.error('Error cleaning up photos:', e)
    }
  }
  event.waitUntil(promise())
  setResponseStatus(event, 204)
})
