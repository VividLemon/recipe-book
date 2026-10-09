<template>
  <RecipesCreateUpdate
    v-model="recipe"
    :loading
    @save="save"
    @add-steps-image="registerStepsImage"
  />
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['authenticated', 'online'] })

import { buildOptimisticRecipe } from '~/queries/recipeCache'
import type { IngredientWeb, recipeDifficultyWeb } from '../../../types/recipe'
import type { CreateRecipeModel } from '../../components/recipes/CreateUpdate.vue'

const toaster = useToaster()
const recipeTags = await useFetch('/api/recipe-tags')
const { create } = useRecipeMutations()

const recipe = ref<CreateRecipeModel>({
  name: '',
  ingredients: [] as IngredientWeb[],
  steps: '',
  difficulty: null as null | (typeof recipeDifficultyWeb)[number],
  time: null,
  coverImage: null as File | null,
  isPublic: true,
  tags: [] as string[],
  stepsImages: [] as string[]
})

const registerStepsImage = (src: string) => {
  recipe.value.stepsImages = recipe.value.stepsImages || []
  recipe.value.stepsImages.push(src)
}

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
const save = async () => {
  try {
    if (!recipe.value.difficulty || !recipe.value.time) return

    loading.value = true

    const { coverImage, ...rest } = recipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { coverImage }
    })

    const time = Number.parseInt(rest.time || '')
    const data = await create.mutateAsync({
      body,
      optimistic: buildOptimisticRecipe(
        { ...rest, difficulty: rest.difficulty!, time },
        recipeTags.data.value ?? []
      )
    })

    await pushToRoot.execute(data.id)
    await using _ = await toaster.apiSucceeded('Recipe created!')
  } catch (e) {
    await using _ = await toaster.apiError(e)
  } finally {
    loading.value = false
  }
}
</script>
