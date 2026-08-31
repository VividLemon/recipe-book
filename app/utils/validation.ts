import type {FieldMeta} from 'vee-validate'

export const validateStateError = ({ valid, dirty }: FieldMeta<unknown>) =>
  dirty && !valid ? false : null
