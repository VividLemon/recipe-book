/** Cache Storage names shared by the service worker and the app. */
export const offlineCacheNames = {
  /** The data-free app shell served for navigations while offline. Never user specific. */
  shell: 'offline-shell',
  /** Photos of the user's own recipes, written only by the installed app's sync. */
  photos: 'recipe-photos'
} as const

/** Route rendered client side only, so its HTML carries no session or recipe data. */
export const offlineShellUrl = '/_offline'
