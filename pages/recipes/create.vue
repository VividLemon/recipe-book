<template>
  <BForm method="POST" action="/api/recipes">
    <BFormGroup label="Name" floating v-bind="validateState('name')">
      <BFormInput
        v-model="recipe.name"
        placeholder="Name"
        @update:model-value="v$.recipe.name.$touch"
        @blur="v$.recipe.name.$touch"
      />
    </BFormGroup>
    <!-- <BFormInput v-model="ingredients" label="Ingredients" /> -->
    <!-- <BFormInput v-model="steps" label="Steps" /> -->
    <BFormInput v-model="recipe.difficulty" type="number" label="Difficulty" />
    <BFormInput v-model="recipe.time" type="number" label="Time" />
    <BFormFile v-model="recipe.photo" label="Photo" />
    <BButton type="submit">Submit</BButton>
    {{ recipe }}
  </BForm>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import type { CreateRecipeRequest } from '~/types/recipe'

const recipe = ref({
  name: '',
  ingredients: [],
  steps: [],
  difficulty: null,
  time: null,
  photo: null
} satisfies Record<keyof CreateRecipeRequest, unknown> & { photo: File | null })

const v$ = useVuelidate(
  {
    recipe: {
      name: {
        required
      }
    }
  },
  { recipe }
)

const validateState = (val: keyof typeof recipe.value) => {
  const { $dirty, $error, $errors } = v$.value.recipe[val]
  return $dirty
    ? {
        state: !$error ? null : false,
        invalidFeedback: $errors[0]?.$message
      }
    : undefined
}

const save = async () => {
  if (!(await v$.value.$validate())) return
  const { photo, ...rest } = recipe.value

  const formData = new FormData()
  if (photo) formData.append('photo', photo)

  $fetch('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe.value),
    
  })
}
</script>
