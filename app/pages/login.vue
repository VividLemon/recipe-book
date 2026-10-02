<template>
  <BContainer class="py-4" style="max-width: 32rem">
    <h1>Log in</h1>
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm @submit.prevent="login">
      <BFormGroup label="Email" label-for="login-email">
        <BFormInput id="login-email" v-model="credentials.email" type="email" required autocomplete="email" />
      </BFormGroup>
      <BFormGroup label="Password" label-for="login-password" class="mt-3">
        <BFormInput id="login-password" v-model="credentials.password" type="password" required autocomplete="current-password" />
      </BFormGroup>
      <BButton class="mt-3" type="submit" variant="primary" :disabled="loading">
        {{ loading ? 'Logging in…' : 'Log in' }}
      </BButton>
    </BForm>
    <p class="mt-3">New here? <BLink to="/register">Create an account</BLink></p>
  </BContainer>
</template>

<script setup lang="ts">
const credentials = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const { fetch: refreshSession } = useUserSession()
const clearRecipeCache = useRecipeSessionCache()

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: credentials })
    await refreshSession()
    clearRecipeCache()
    await navigateTo('/')
  } catch {
    error.value = 'Unable to log in with those credentials.'
  } finally {
    loading.value = false
  }
}
</script>
