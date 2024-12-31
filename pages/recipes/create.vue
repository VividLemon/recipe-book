<template>
  <BForm>
    <div>
      <BFormInput
        v-model="recipe.name"
        placeholder="Name"
        v-bind="validateState('name')"
      />
      <BFormInvalidFeedback v-show="!validateState('name')?.state">
        {{ validateState('name')?.invalidFeedback }}
      </BFormInvalidFeedback>
    </div>
    <div>
      <BFormTags
        :model-value="recipe.ingredients.map((el) => el.name)"
        placeholder="Ingredients"
        v-bind="validateState('ingredients')"
        @update:model-value="onUpdateIngredient"
      />
      <BFormInvalidFeedback v-show="!validateState('ingredients')?.state">
        {{ validateState('ingredients')?.invalidFeedback }}
      </BFormInvalidFeedback>
      <div v-for="ingredient in recipe.ingredients" :key="ingredient.name">
        {{ ingredient.name }} Quantity:
        <BFormSpinbutton v-model="ingredient.quantity" inline />
      </div>
    </div>
    <div>
      <ClientOnly>
        <TiptapEditor
          v-model="recipe.steps"
          :state="validateState('steps')?.state"
          @blur="v$.recipe.steps.$touch"
        />
      </ClientOnly>
    </div>
    <div>
      <BFormSelect
        v-model="recipe.difficulty"
        :options="recipeDifficulties"
        v-bind="validateState('difficulty')"
      />
      <BFormInvalidFeedback v-show="!validateState('difficulty')?.state">
        {{ validateState('difficulty')?.invalidFeedback }}
      </BFormInvalidFeedback>
    </div>
    <div>
      <BFormInput
        v-model="recipe.time"
        type="number"
        placeholder="Time in Minutes"
        v-bind="validateState('time')"
      />
      <BFormInvalidFeedback v-show="!validateState('time')?.state">
        {{ validateState('time')?.invalidFeedback }}
      </BFormInvalidFeedback>
    </div>
    <div>
      <BFormFile
        v-model="recipe.photo"
        label="Photo"
        :directory="nullHack"
        v-bind="validateState('photo')"
      />
      <BFormInvalidFeedback v-show="!validateState('photo')?.state">
        {{ validateState('photo')?.invalidFeedback }}
      </BFormInvalidFeedback>
    </div>
    <BButton type="button" @click="save">Save</BButton>
    {{ recipe }}
  </BForm>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, integer } from '@vuelidate/validators'
import {
  type CreateRecipeRequest,
  type Ingredient,
  recipeDifficulty
} from '~/types/recipe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nullHack = null as any

const toaster = useToaster()
const recipe = ref({
  name: '',
  ingredients: [] as Ingredient[],
  steps: '',
  difficulty: null as null | (typeof recipeDifficulty)[number],
  time: null,
  photo: null
} satisfies Record<keyof CreateRecipeRequest, unknown> & { photo: File | null })

const recipeDifficulties = [
  { value: null, text: 'Select Difficulty' },
  ...recipeDifficulty.map((el) => ({ value: el, text: el }))
]
const v$ = useVuelidate(
  {
    recipe: {
      name: {
        required
      },
      difficulty: {
        required
      },
      time: {
        required,
        integer
      },
      steps: {
        required
      },
      ingredients: {
        required
      }
    }
  },
  { recipe }
)
const validateState = (val: keyof typeof recipe.value) => {
  const validated = v$.value.recipe[val]
  if (!validated) return undefined
  const e = {
    'onUpdate:modelValue': () => v$.value.recipe[val].$touch(),
    onBlur: () => v$.value.recipe[val].$touch()
  }
  return validated.$dirty
    ? {
        state: validateStateError(validated),
        invalidFeedback: validated.$errors[0]?.$message,
        ...e
      }
    : {
        ...e,
        state: null,
        invalidFeedback: null
      }
}
const onUpdateIngredient = (e: readonly string[]) => {
  e.forEach((el) => {
    if (recipe.value.ingredients.some((ingredient) => ingredient.name === el))
      return
    recipe.value.ingredients.push({ name: el, quantity: 1 })
  })
}

const save = async () => {
  try {
    if (!(await v$.value.$validate())) return

    const formData = objToFormData(recipe.value)

    const data = await $fetch('/api/recipes', {
      method: 'POST',
      body: formData
    })
  } catch (e) {
    toaster.apiError(e)
  }
}
</script>
