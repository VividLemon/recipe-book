export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client || navigator.onLine) return
  const toaster = useToaster()
  toaster.error('Recipe changes are unavailable while offline. You can still view saved recipes.')
  return navigateTo('/')
})
