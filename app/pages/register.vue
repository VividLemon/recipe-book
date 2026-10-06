<template>
  <BContainer class="py-4" style="max-width: 32rem">
    <h1>Create account</h1>
    <BAlert v-if="error" :model-value="true" variant="danger">{{ error }}</BAlert>
    <BForm novalidate @submit.prevent="register">
      <BFormGroup label="Username" label-for="register-username">
        <BFormInput
          id="register-username"
          v-model="username"
          v-bind="usernameAttrs"
          autocomplete="username"
          :state="errors.username ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.username" :state="false">
          {{ errors.username }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BFormGroup label="Email" label-for="register-email" class="mt-3">
        <BFormInput
          id="register-email"
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
      <BFormGroup label="Password" label-for="register-password" class="mt-3">
        <AccountPasswordInput
          id="register-password"
          v-model="password"
          v-bind="passwordAttrs"
          autocomplete="new-password"
          :state="errors.password ? false : null"
        />
        <BFormInvalidFeedback v-if="errors.password" :state="false">
          {{ errors.password }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <BButton class="mt-3" type="submit" variant="primary" :loading="isSubmitting">
        Create account
      </BButton>
    </BForm>
    <p class="mt-3">Already registered? <BLink to="/login">Log in</BLink></p>
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
  initialValues: { username: '', email: '', password: '' },
  validationSchema: toTypedSchema(object({
    username: string().trim().min(2).max(40),
    email: emailValidator(),
    password: string().min(8).max(128)
  }))
})
const [username, usernameAttrs] = defineField('username')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const register = handleSubmit(async (credentials) => {
  error.value = ''
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: credentials })
    await refreshSession()
    for (const entry of queryCache.getEntries({ key: recipeKeys.root })) {
      queryCache.remove(entry)
    }
    await navigateTo('/')
  } catch {
    error.value = 'Unable to create an account. The username or email may already be in use.'
  }
})
</script>
