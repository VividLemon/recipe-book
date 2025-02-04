<template>
  <RecipesCreateUpdate
    v-model="recipe"
    :loading
    @save="save"
    @add-steps-image="registerStepsImage"
  />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import type { Ingredient, recipeDifficulty } from '~/types/recipe'
import type { CreateRecipeModel } from '../../components/recipes/CreateUpdate.vue'

const toaster = useToaster()

const recipe = ref<CreateRecipeModel>({
  name: '',
  ingredients: [] as Ingredient[],
  steps: '',
  difficulty: null as null | (typeof recipeDifficulty)[number],
  time: null,
  coverImage: null as File | null,
  tags: [] as string[],
  stepsImages: [] as string[]
})

const v$ = useVuelidate()

const registerStepsImage = (src: string) => {
  recipe.value.stepsImages = recipe.value.stepsImages || []
  recipe.value.stepsImages.push(src)
}

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
const save = async () => {
  try {
    if (
      !(await v$.value.$validate()) ||
      !recipe.value.difficulty ||
      !recipe.value.time
    )
      return

    loading.value = true

    const { coverImage, ...rest } = recipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { coverImage }
    })

    const data = await $fetch('/api/recipes', {
      method: 'POST',
      body
    })

    await pushToRoot.execute(data.id)
    toaster.apiSucceeded('Recipe created!')
  } catch (e) {
    toaster.apiError(e)
  } finally {
    loading.value = false
  }
}
</script>
