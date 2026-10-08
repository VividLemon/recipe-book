<template>
  <BModal v-model="open" title="Change password">
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm id="change-password-form" novalidate @submit.prevent="onSubmit">
      <BFormGroup label="Old password" label-for="old-password">
        <AccountPasswordInput
          id="old-password"
          v-model="oldPassword"
          v-bind="oldPasswordAttrs"
          autocomplete="current-password"
          :state="errors.oldPassword ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.oldPassword" :state="false">
          {{ errors.oldPassword }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BFormGroup label="New password" label-for="new-password" class="mt-3">
        <AccountPasswordInput
          id="new-password"
          v-model="newPassword"
          v-bind="newPasswordAttrs"
          autocomplete="new-password"
          :state="errors.newPassword ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.newPassword" :state="false">
          {{ errors.newPassword }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BFormGroup label="Repeat new password" label-for="confirm-password" class="mt-3">
        <AccountPasswordInput
          id="confirm-password"
          v-model="confirmPassword"
          v-bind="confirmPasswordAttrs"
          autocomplete="new-password"
          :state="errors.confirmPassword ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.confirmPassword" :state="false">
          {{ errors.confirmPassword }}
        </BFormInvalidFeedback>
      </BFormGroup>
    </BForm>
    <template #footer>
      <BButton variant="secondary" @click="open = false">Cancel</BButton>
      <BButton type="submit" form="change-password-form" variant="primary" :loading="loading || isSubmitting">
        Update password
      </BButton>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { object, string } from 'zod'

const props = defineProps<{
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [credentials: { oldPassword: string; newPassword: string }]
}>()

const open = defineModel<boolean>({ required: true })

const {
  defineField,
  errors,
  handleSubmit,
  isSubmitting,
  resetForm
} = useForm({
  initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  validationSchema: toTypedSchema(
    object({
      oldPassword: string().min(1).max(128),
      newPassword: string().min(1).max(128),
      confirmPassword: string().min(1).max(128)
    }).refine((values) => values.newPassword === values.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match'
    })
  )
})
const [oldPassword, oldPasswordAttrs] = defineField('oldPassword')
const [newPassword, newPasswordAttrs] = defineField('newPassword')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

const onSubmit = handleSubmit(({ oldPassword, newPassword }) => {
  if (!props.loading) emit('submit', { oldPassword, newPassword })
})

watch(open, (value) => {
  if (!value) {
    resetForm({
      values: { oldPassword: '', newPassword: '', confirmPassword: '' }
    })
  }
})
</script>
