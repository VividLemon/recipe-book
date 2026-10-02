import { cleanupOrphanedPhotos } from '../../../photos/operations'
import { consola } from 'consola'
import { useRecipeRepository } from '#server/recipes/repository.ts';

export default defineEventHandler(async (event) => {
  const promise = async () => {
    try {
      const recipes = await useRecipeRepository().list()
      await cleanupOrphanedPhotos(recipes)
    } catch (e) {
      consola.error('Error cleaning up photos:', e)
    }
  }
  event.waitUntil(promise())
  setResponseStatus(event, 204)
})
