import {file} from 'zod'

export const usePhotoFileValidation = ({
  acceptedType = undefined
}: {
  acceptedType?: MaybeRefOrGetter<string[]>,
} = {}) => {
    const appConfig = useAppConfig()
    const acceptableTypes = computed(() => {
        const type = toValue(acceptedType)
        if (type) return type
        return appConfig.picture.acceptedImageTypes
      })

  return (optional: boolean = false) => {
   const v = file().min(1).max(1024 * 1024).mime(acceptableTypes.value)
    if(optional) {
      v.optional()
    }
    return v
  }
}
