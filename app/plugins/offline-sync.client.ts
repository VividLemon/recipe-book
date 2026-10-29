import { wipeOfflineData } from '~/data/offline/wipe'
import { localRecipeStore } from '~/data/recipes/localStore'
import { detectImageFormat, syncPhotoCache } from '~/data/recipes/photos'
import { syncOwnRecipes } from '~/data/recipes/sync'

const syncInterval = 15 * 60_000

/**
 * Keeps the signed-in user's own recipes and their photos on the device:
 * syncs on start, when the connection returns and every so often, and clears
 * the device copy when the user signs out or changes.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { user } = useUserSession()
  let running: Promise<void> | undefined

  const run = (force = false) => {
    running ??= (async () => {
      try {
        const meta = await localRecipeStore.getMeta()
        const userId = user.value?.id
        if (!userId) {
          // Offline the session cannot be checked, so keep the data until we know
          if (meta && navigator.onLine) await wipeOfflineData()
          return
        }
        if (meta && meta.userId !== userId) await wipeOfflineData()
        else if (!force && meta && Date.now() - meta.lastSyncedAt < syncInterval) return
        if (!navigator.onLine) return

        await syncOwnRecipes(userId, {
          fetch: (url, options) => $fetch(url, options),
          store: localRecipeStore,
          syncPhotos: syncPhotoCache,
          imageFormat: await detectImageFormat()
        })
      } catch (error) {
        // Offline copies are a convenience; never surface sync failures as page errors
        console.warn('Offline sync failed', error)
      } finally {
        running = undefined
      }
    })()
    return running
  }

  nuxtApp.hook('app:mounted', () => {
    navigator.storage?.persist?.().catch(() => {})
    watch(() => user.value?.id, () => run(), { immediate: true })
    useEventListener(window, 'online', () => run())
    useIntervalFn(() => run(), syncInterval)
  })

  return { provide: { syncOfflineRecipes: () => run(true) } }
})
