/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { offlineCacheNames, offlineShellUrl } from '../data/offline/cacheNames'

declare const self: ServiceWorkerGlobalScope

// Only static build assets are precached. Nothing user specific is written by
// the worker: pages embed the session, and photos are access controlled.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(offlineCacheNames.shell).then((cache) => cache.add(offlineShellUrl)))
})

const fromCacheWhenOffline = async (request: Request, cacheName: string, fallbackUrl?: string) => {
  try {
    return await fetch(request)
  } catch (error) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(fallbackUrl ?? request)
    if (cached) return cached
    throw error
  }
}

// Pages always come from the network; offline, the shell boots the app,
// which then reads the device copy of the user's recipes.
registerRoute(new NavigationRoute(({ request }) =>
  fromCacheWhenOffline(request, offlineCacheNames.shell, offlineShellUrl)))

// Online, the server decides who may see a photo. The cache only answers when
// the network does not, and holds only photos the installed app synced.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/photos/'),
  ({ request }) => fromCacheWhenOffline(request, offlineCacheNames.photos)
)
