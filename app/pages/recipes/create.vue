<template>
  <RecipesCreateUpdate
    v-model="recipe"
    :loading
    @save="save"
    @add-steps-image="registerStepsImage"
  />
</template>

<script setup lang="ts">
import type { IngredientWeb, recipeDifficultyWeb } from '../../../types/recipe'
import type { RecipeWeb } from '../../../types/recipe'
import type { CreateRecipeModel } from '../../components/recipes/CreateUpdate.vue'

const toaster = useToaster()

const recipe = ref<CreateRecipeModel>({
  name: '',
  ingredients: [] as IngredientWeb[],
  steps: '',
  difficulty: null as null | (typeof recipeDifficultyWeb)[number],
  time: null,
  coverImage: null as File | null,
  tags: [] as string[],
  stepsImages: [] as string[]
})

const registerStepsImage = (src: string) => {
  recipe.value.stepsImages = recipe.value.stepsImages || []
  recipe.value.stepsImages.push(src)
}

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
const recipeMutations = useRecipeMutations()
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

    const now = Date.now()
    const optimisticRecipe: RecipeWeb = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: rest.name,
      ingredients: rest.ingredients,
      tags: rest.tags.map((id) => ({ id, text: id, createdAt: now })),
      steps: rest.steps,
      difficulty: rest.difficulty,
      time: Number.parseInt(rest.time || '')
    }
    const data = await recipeMutations.create.mutateAsync({
      body,
      optimisticRecipe
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
