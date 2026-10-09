import { useRegisterSW } from 'virtual:pwa-register/vue'

export const usePwa = () => {
  const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)
  const dismissedUpdate = useLocalStorage('recipe-book:pwa-update-dismissed', false)
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  const canInstall = computed(() => deferredPrompt.value !== null)
  const updateAvailable = computed(() => needRefresh.value && !dismissedUpdate.value)

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  }

  onMounted(() => window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt))
  onUnmounted(() => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt))

  const install = async () => {
    if (!deferredPrompt.value) return
    await deferredPrompt.value.prompt()
    deferredPrompt.value = null
  }

  const applyUpdate = () => updateServiceWorker(true)
  const dismissUpdate = () => { dismissedUpdate.value = true }

  return { applyUpdate, canInstall, dismissUpdate, install, updateAvailable }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
