<template>
  <BContainer class="py-4" style="max-width: 32rem">
    <h1>Log in</h1>
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm novalidate @submit.prevent="login">
      <BFormGroup label="Email" label-for="login-email">
        <BFormInput
          id="login-email"
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          autocomplete="email"
          :state="errors.email ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.email" :state="false">
          {{ errors.email }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BFormGroup label="Password" label-for="login-password" class="mt-3">
        <AccountPasswordInput
          id="login-password"
          v-model="password"
          v-bind="passwordAttrs"
          autocomplete="current-password"
          :state="errors.password ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.password" :state="false">
          {{ errors.password }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BButton class="mt-3" type="submit" variant="primary" :loading="isSubmitting">
        Log in
      </BButton>
    </BForm>
    <p class="mt-3">New here? <BLink to="/register">Create an account</BLink></p>
  </BContainer>
</template>

<script setup lang="ts">
import { useQueryCache } from '@pinia/colada'
import { recipeKeys } from '~/queries/recipes'
import { email as emailValidator, object, string } from 'zod'

const error = ref('')
const { fetch: refreshSession } = useUserSession()
const queryCache = useQueryCache()

const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  initialValues: { email: '', password: '' },
  validationSchema: toTypedSchema(object({
    email: emailValidator(),
    password: string().min(1).max(128)
  }))
})
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const login = handleSubmit(async (credentials) => {
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: credentials })
    await refreshSession()
    for (const entry of queryCache.getEntries({ key: recipeKeys.root })) {
      queryCache.remove(entry)
    }
    await navigateTo('/')
  } catch {
    error.value = 'Unable to log in with those credentials.'
  }
})
</script>
