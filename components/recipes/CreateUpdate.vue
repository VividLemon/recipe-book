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
        :state="validateStateError(v$.recipe.photo)"
        @update:model-value="v$.recipe.photo.$touch"
        @blur="v$.recipe.photo.$touch"
      />
      <BFormInvalidFeedback v-show="!validateStateError(v$.recipe.photo)">
        {{ v$.$errors[0]?.$message }}
      </BFormInvalidFeedback>
    </div>
    <BButton type="button" @click="emit('save')">Save</BButton>
  </BForm>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, integer } from '@vuelidate/validators'
import {
  type CreateRecipeRequest,
  recipeDifficulty,
  type UpdateRecipeRequest
} from '~/types/recipe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nullHack = null as any
const recipeDifficulties = [
  { value: null, text: 'Select Difficulty' },
  ...recipeDifficulty.map((el) => ({ value: el, text: el }))
]

const emit = defineEmits<{
  save: []
}>()

const recipe = defineModel<
  | (Omit<CreateRecipeRequest, 'difficulty' | 'time' | 'photo'> & {
      difficulty: null | string
      time: null | string
      photo: File | null
    })
  | (Omit<UpdateRecipeRequest, 'difficulty' | 'time' | 'photo'> & {
      difficulty: null | string
      time: null | string
      photo: File | null
    })
>({
  required: true
})

const fileValidation = usePhotoFileValidation()
const v$ = useVuelidate(
  computed(() => ({
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
      },
      photo: fileValidation.value
    }
  })),
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
</script>
