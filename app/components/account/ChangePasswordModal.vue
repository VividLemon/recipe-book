<template>
  <BModal v-model="open" title="Change password">
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm id="change-password-form" @submit.prevent="submit">
      <BFormGroup label="Old password" label-for="old-password">
        <BFormInput id="old-password" v-model="oldPassword" type="password" required autocomplete="current-password" />
      </BFormGroup>
      <BFormGroup label="New password" label-for="new-password" class="mt-3">
        <BFormInput id="new-password" v-model="newPassword" type="password" required minlength="8" autocomplete="new-password" />
      </BFormGroup>
      <BFormGroup label="Repeat new password" label-for="confirm-password" class="mt-3">
        <BFormInput id="confirm-password" v-model="confirmPassword" type="password" required minlength="8" autocomplete="new-password" />
        <BFormInvalidFeedback :state="!confirmPassword || confirmPassword === newPassword">
          Passwords must match.
        </BFormInvalidFeedback>
      </BFormGroup>
    </BForm>
    <template #footer>
      <BButton variant="secondary" @click="open = false">Cancel</BButton>
      <BButton type="submit" form="change-password-form" variant="primary" :disabled="loading">
        {{ loading ? 'Updating…' : 'Update password' }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [credentials: { oldPassword: string; newPassword: string; confirmPassword: string }]
}>()

const open = defineModel<boolean>({ required: true })
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const submit = () => {
  if (props.loading || newPassword.value.length < 8 || newPassword.value !== confirmPassword.value) return
  emit('submit', {
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value
  })
}

watch(open, (value) => {
  if (!value) {
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
})
</script>
