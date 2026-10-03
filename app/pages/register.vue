<template>
  <BContainer class="py-4" style="max-width: 32rem">
    <h1>Create account</h1>
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm @submit.prevent="register">
      <BFormGroup label="Username" label-for="register-username">
        <BFormInput id="register-username" v-model="credentials.username" required minlength="2" maxlength="40" autocomplete="username" />
      </BFormGroup>
      <BFormGroup label="Email" label-for="register-email" class="mt-3">
        <BFormInput id="register-email" v-model="credentials.email" type="email" required autocomplete="email" />
      </BFormGroup>
      <BFormGroup label="Password" label-for="register-password" class="mt-3">
        <BFormInput id="register-password" v-model="credentials.password" type="password" required minlength="8" autocomplete="new-password" />
      </BFormGroup>
      <BButton class="mt-3" type="submit" variant="primary" :disabled="loading">
        {{ loading ? 'Creating account…' : 'Create account' }}
      </BButton>
    </BForm>
    <p class="mt-3">Already registered? <BLink to="/login">Log in</BLink></p>
  </BContainer>
</template>

<script setup lang="ts">
const credentials = reactive({ username: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)
const { fetch: refreshSession } = useUserSession()
const clearRecipeCache = useRecipeSessionCache()

const register = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: credentials })
    await refreshSession()
    clearRecipeCache()
    await navigateTo('/')
  } catch {
    error.value = 'Unable to create an account. The username or email may already be in use.'
  } finally {
    loading.value = false
  }
}
</script>
