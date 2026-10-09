export const usePwa = () => {
  const pwa = usePWA()
  const dismissedUpdate = useLocalStorage('recipe-book:pwa-update-dismissed', false)

  const canInstall = computed(() =>
    (pwa?.showInstallPrompt ?? false) && !(pwa?.isPWAInstalled ?? false)
  )
  const updateAvailable = computed(() => (pwa?.needRefresh ?? false) && !dismissedUpdate.value)

  const install = () => pwa?.install()
  const applyUpdate = () => pwa?.updateServiceWorker(true)
  const dismissUpdate = () => { dismissedUpdate.value = true }

  return { applyUpdate, canInstall, dismissUpdate, install, updateAvailable }
}
