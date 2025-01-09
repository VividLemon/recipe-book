import type { ValidationState } from 'bootstrap-vue-next'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const useStateClass = (value: MaybeRefOrGetter<ValidationState>) =>
  computed(() => {
    const resolvedValue = toValue(value)

    return resolvedValue === true
      ? 'is-valid'
      : resolvedValue === false
        ? 'is-invalid'
        : null
  })
