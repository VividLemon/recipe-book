export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client && !navigator.onLine) {
    return navigateTo('/')
  }
})
