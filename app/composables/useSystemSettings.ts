import type {InjectionKey} from "vue";

const systemSettingsKey: InjectionKey<{
    downloads: {
      preferredDownloadFileType: Readonly<Ref<LocalFileTypeDownload>>
      setFileType: (value: LocalFileTypeDownload) => void
    }
    dense: {
      prefersDenseRecipeModal: Readonly<Ref<boolean>>
      setDenseRecipeModal: (value: boolean) => void
    }
}> = Symbol('systemSettings')

export const provideSystemSettings = () => {
  const settings = useLocalStorage<{
    preferredDownloadFileType: LocalFileTypeDownload
    prefersDenseRecipeModal: boolean
  }>('settings', {
    preferredDownloadFileType: 'json',
    prefersDenseRecipeModal: false
  }, {
    initOnMounted: true,
    mergeDefaults: true
  })

  provide(systemSettingsKey, {
    downloads: {
      preferredDownloadFileType: computed(() => settings.value.preferredDownloadFileType),
      setFileType: (value) => {
        settings.value.preferredDownloadFileType = value
      },
    },
    dense: {
      prefersDenseRecipeModal: computed(() => settings.value.prefersDenseRecipeModal),
      setDenseRecipeModal: (value) => {
        settings.value.prefersDenseRecipeModal = value
      }
    }
  })
}

export const useSystemSettings = () => {
  const settings = inject(systemSettingsKey)
  if (!settings)
    throw new Error('System settings not provided or used outside of setup')

  return settings
}
