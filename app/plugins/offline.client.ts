import type { UserSession } from '#auth-utils'
import { isInstalledPwa } from '~/data/offline/installed'
import { wipeOfflineData } from '~/data/offline/wipe'
import { localRecipeStore } from '~/data/recipes/localStore'
import { detectImageFormat, syncPhotoCache } from '~/data/recipes/photos'
import { syncOwnRecipes } from '~/data/recipes/sync'

const syncInterval = 15 * 60_000

/**
 * Offline data for the installed app: registers the service worker and keeps
 * the signed-in user's own recipes and photos on the device. In a browser tab
 * none of this runs; only the sign-out wipe is offered, since a tab shares
 * storage with an installed app on the same device.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const installed = isInstalledPwa()
  const { user, session } = useUserSession()

  // Jobs run one at a time, so a wipe never interleaves with a sync's writes
  let queue = Promise.resolve()
  const enqueue = (job: () => Promise<unknown>) => {
    queue = queue.then(job).then(
      () => {},
      (error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn('Offline data update failed', error)
      }
    )
    return queue
  }

  // Replaced whenever the signed-in user changes. Aborting it stops the
  // running sync before its next write, so it cannot restore the previous
  // user's data after a wipe.
  let identity = new AbortController()
  const newIdentity = () => {
    identity.abort()
    identity = new AbortController()
  }

  const wipe = () => {
    newIdentity()
    return enqueue(wipeOfflineData)
  }

  const sync = (force = false) => {
    if (!installed) return queue
    const signal = identity.signal
    return enqueue(async () => {
      const userId = user.value?.id
      if (signal.aborted || !userId || !navigator.onLine) return
      const meta = await localRecipeStore.getMeta()
      if (!force && meta?.userId === userId && Date.now() - meta.lastSyncedAt < syncInterval) return
      // Another user's data, photos included, goes before anything of this user's is stored
      if (meta && meta.userId !== userId) await wipeOfflineData()
      await syncOwnRecipes(userId, {
        fetch: (url, options) => $fetch(url, options),
        store: localRecipeStore,
        syncPhotos: syncPhotoCache,
        imageFormat: await detectImageFormat(),
        signal
      })
    })
  }

  // No user may only mean the session could not be checked (the app started
  // offline). Only a successful answer without a user means signed out.
  const resolveSignedOut = async () => {
    const current = await $fetch<UserSession>('/api/_auth/session').catch(() => undefined)
    if (current?.user) session.value = current
    return !!current && !current.user
  }

  const onUserChange = async (userId: string | undefined) => {
    newIdentity()
    if (userId) return sync()
    if (await resolveSignedOut()) return wipe()
  }

  nuxtApp.hook('app:mounted', () => {
    if (!installed) return
    navigator.serviceWorker?.register('/sw.js').catch((error) => console.warn('Service worker registration failed', error))
    navigator.storage?.persist?.().catch(() => {})
    watch(() => user.value?.id, onUserChange, { immediate: true })
    // Forced: photos missed when the connection dropped are retried right away
    useEventListener(window, 'online', () => user.value ? sync(true) : resolveSignedOut())
    useIntervalFn(() => sync(), syncInterval)
  })

  return {
    provide: {
      offlineData: {
        /** True in the installed app, where offline data is kept. */
        installed,
        wipe,
        sync: () => sync(true)
      }
    }
  }
})
