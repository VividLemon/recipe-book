<template>
  <BContainer class="py-4">
    <h1>My profile</h1>
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BAlert v-if="success" :model-value="true" variant="success">Password updated.</BAlert>
    <dl v-if="profile.data.value">
      <dt>Username</dt>
      <dd>{{ profile.data.value.username }}</dd>
      <dt>Email</dt>
      <dd>{{ profile.data.value.email }}</dd>
    </dl>
    <BButton variant="primary" @click="showPasswordModal = true">Change password</BButton>
    <AccountChangePasswordModal
      v-model="showPasswordModal"
      :loading
      :error
      @submit="changePassword"
    />
  </BContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' })

const profile = await useFetch('/api/user')
const showPasswordModal = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const changePassword = async (credentials: {
  oldPassword: string
  newPassword: string
}) => {
  loading.value = true
  error.value = ''
  success.value = false
  try {
    await $fetch('/api/user/password', { method: 'PUT', body: credentials })
    showPasswordModal.value = false
    success.value = true
  } catch {
    error.value = 'Could not update password. Check your current password and try again.'
  } finally {
    loading.value = false
  }
}
</script>
