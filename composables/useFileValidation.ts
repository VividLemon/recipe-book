import { helpers, required } from '@vuelidate/validators'

export const usePhotoFileValidation = ({
  acceptedType = undefined
}: {
  acceptedType?: MaybeRefOrGetter<string[]>
} = {}) => {
  const runtimeConfig = useRuntimeConfig()
  const acceptableTypes = computed(() => {
    const type = toValue(acceptedType)
    if (type) return type
    return runtimeConfig.public.picture.acceptedImageTypes
  })

  return computed(() => ({
    required,
    isObject: helpers.withMessage(
      'Unknown type, expected object',
      (v: unknown) => {
        if (!helpers.req(v)) return true
        return v instanceof File
      }
    ),
    acceptedType: helpers.withMessage(
      `Invalid file type. Acceptable types are: ${acceptableTypes.value.join(', ')}`,
      (v: unknown) => {
        if (!helpers.req(v) || !(v instanceof File)) return true
        return acceptableTypes.value.includes(v.type)
      }
    )
  }))
}
