import type { InjectionKey } from 'vue'

export const systemSettingsKey: InjectionKey<{
  localDownloadFileType: Readonly<Ref<LocalFileTypeDownload>>
  setLocalDownloadFileType: (type: LocalFileTypeDownload) => void
  denseRecipeModal: Readonly<Ref<boolean>>
  setDenseRecipeModal: (dense: boolean) => void
}> = Symbol('settings')
