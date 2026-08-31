import type {MaybeRefOrGetter} from "vue";
import type {ToastOrchestratorCreateParamBase} from "bootstrap-vue-next";

export const useToaster = () => {
  const toaster = useToast()

  return {
    ...toaster,
    error(body: MaybeRefOrGetter<string>) {
      const bodyRef = toRef(body)
      const input = ref<ToastOrchestratorCreateParamBase>({
        body: bodyRef.value,
        variant: 'danger',
        title: 'Error'
      })
      watchEffect(() => {
        input.value.body = bodyRef.value
      })
      return toaster.create(input).show()
    },
    apiError(err: MaybeRefOrGetter<unknown>) {
      const errRef = toRef(err)
      const input = ref<ToastOrchestratorCreateParamBase>({
        body: errorToString(errRef.value),
        variant: 'danger',
        title: 'Error'
      })
      watchEffect(() => {
        input.value.body = errorToString(errRef.value)
      })
      return toaster.create(input).show()
    },
    apiSucceeded(body: MaybeRefOrGetter<string>) {
      const bodyRef = toRef(body)
      const input = ref<ToastOrchestratorCreateParamBase>({
        body: bodyRef.value,
        variant: 'success',
        title: 'Success'
      })
      watchEffect(() => {
        input.value.body = bodyRef.value
      })
      return toaster.create(input).show()
    }
  }
}
