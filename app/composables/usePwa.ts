export const usePwa = () => {
  const pwa = useNuxtApp().$pwa
  const unavailable = shallowRef(false)

  const value = computed(() => pwa || {
    isPWAInstalled: false,
    showInstallPrompt: false,
    install: async (): Promise<void> => undefined,
    needRefresh: false,
    updateServiceWorker: async () => undefined,
    cancelPrompt: (): void => undefined
  })

  return {
    isPWAInstalled: computed(() => value.value.isPWAInstalled),
    canInstall: computed(() => value.value.showInstallPrompt && !unavailable.value),
    updateAvailable: computed(() => value.value.needRefresh),
    install: () => value.value.install(),
    applyUpdate: () => value.value.updateServiceWorker(true),
    dismissUpdate: () => value.value.cancelPrompt()
  }
}
