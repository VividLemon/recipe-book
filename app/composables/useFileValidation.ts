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
    // `.nullable()` keeps the input/output shape as `File | null` for both branches
    // (matching the `coverImage: File | null` recipe model), the `optional` flag only
    // controls whether `null` is allowed to pass validation at runtime.
    return file()
      .min(1)
      .max(1024 * 1024)
      .mime(acceptableTypes.value)
      .nullable()
      .refine((v) => optional || v !== null, 'Cover image is required')
  }
}
