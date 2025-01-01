<template>
  <RecipesCreateUpdate v-model="recipe" @save="save" />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import type {
  CreateRecipeRequest,
  Ingredient,
  recipeDifficulty
} from '~/types/recipe'

const toaster = useToaster()
const router = useRouter()

const recipe = ref<
  Omit<CreateRecipeRequest, 'difficulty' | 'time' | 'photo'> & {
    difficulty: null | string
    time: null | string
    photo: File | null
  }
>({
  name: '',
  ingredients: [] as Ingredient[],
  steps: '',
  difficulty: null as null | (typeof recipeDifficulty)[number],
  time: null,
  photo: null as File | null
})

const v$ = useVuelidate()

const save = async () => {
  try {
    if (
      !(await v$.value.$validate()) ||
      !recipe.value.difficulty ||
      !recipe.value.time
    )
      return

    const { photo, ...rest } = recipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { photo }
    })

    const data = await $fetch('/api/recipes', {
      method: 'POST',
      body
    })

    router.push(`/recipes/${data.id}`)
  } catch (e) {
    toaster.apiError(e)
  }
}
</script>
