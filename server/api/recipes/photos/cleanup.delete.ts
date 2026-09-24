import { cleanupOrphanedPhotos } from '../../../photos/operations'
import { getAllRecipes } from '../../../recipes/service'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const promise = async () => {
    try {
      const recipes = await getAllRecipes()
      await cleanupOrphanedPhotos(recipes)
    } catch (e) {
      consola.error('Error cleaning up photos:', e)
    }
  }
  event.waitUntil(promise())
  setResponseStatus(event, 204)
})
