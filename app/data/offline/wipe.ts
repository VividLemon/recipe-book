import { localRecipeStore } from '../recipes/localStore'
import { offlineCacheNames } from './cacheNames'

/**
 * Removes everything stored for offline use: device recipes, photos (some
 * private), API responses and cached pages (which embed the session user).
 */
export const wipeOfflineData = async () => {
  await Promise.all([
    localRecipeStore.clear(),
    ...Object.values(offlineCacheNames).map((name) => caches.delete(name))
  ])
}
