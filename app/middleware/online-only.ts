/** Blocks client-side navigation to pages that need the network (create/edit). */
export default defineNuxtRouteMiddleware((_to, from) => {
  if (import.meta.server || navigator.onLine) return
  useToaster().error('This page is unavailable while offline')
  return from.matched.length ? abortNavigation() : navigateTo('/')
})
