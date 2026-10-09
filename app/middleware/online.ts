export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client && !navigator.onLine) {
    return abortNavigation('Recipes can only be created or edited while online.')
  }
})
