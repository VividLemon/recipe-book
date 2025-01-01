import type { BaseValidation } from '@vuelidate/core'

export const validateStateError = ({ $error, $dirty }: BaseValidation) =>
  $dirty && $error ? false : null
