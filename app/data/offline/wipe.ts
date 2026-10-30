import { localRecipeStore } from '../recipes/localStore'
import { offlineCacheNames } from './cacheNames'

/**
 * Removes everything stored for the signed-in user: device recipes, tags and
 * photos (some private). The app shell holds no user data and is kept.
 */
export const wipeOfflineData = async () => {
  await Promise.all([
    localRecipeStore.clear(),
    caches.delete(offlineCacheNames.photos)
  ])
}
