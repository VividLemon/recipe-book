<template>
  <RecipesCreateUpdate
    v-model="updateRecipe"
    :loading
    @delete="deleteRecipe"
    @save="save"
  />
</template>

<script setup lang="ts">
import type { UpdateRecipeModel } from '../../../components/recipes/CreateUpdate.vue'
import type { RecipeWeb } from '../../../../types/recipe'
import { until } from '@vueuse/core'

const route = useRoute()
const id = computed(() => route.params.id as string)

const router = useRouter()
const toaster = useToaster()
const previousRecipe = useRecipe(id)
await until(() => previousRecipe.state.value.status).toMatch(/success|error/)
const initialRecipe = previousRecipe.data.value

if (!initialRecipe) {
  await router.push('/')
  toaster.error('Recipe not found')
}

const updateRecipe = ref<UpdateRecipeModel>({
  difficulty: initialRecipe?.difficulty || null,
  ingredients: initialRecipe?.ingredients || [],
  id: id.value || '',
  name: initialRecipe?.name || '',
  coverImage: null,
  steps: initialRecipe?.steps || '',
  tags: initialRecipe?.tags.map((el) => el.id) || [],
  time: initialRecipe?.time.toString() || null,
  raw: initialRecipe ?? null
})

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
const recipeMutations = useRecipeMutations()
const save = async () => {
  try {
    if (!updateRecipe.value.difficulty || !updateRecipe.value.time) return

    loading.value = true

    const { coverImage, ...rest } = updateRecipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { coverImage }
    })

    const previous = updateRecipe.value.raw
    const now = Date.now()
    const optimisticRecipe: RecipeWeb = {
      ...previous,
      id: id.value,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      name: rest.name,
      ingredients: rest.ingredients,
      tags: rest.tags.map((tagId) =>
        previous?.tags.find((tag) => tag.id === tagId) ?? {
          id: tagId,
          text: tagId,
          createdAt: now
        }
      ),
      steps: rest.steps,
      difficulty: rest.difficulty,
      time: Number.parseInt(rest.time || '')
    })

    await recipeMutations.update.mutateAsync({
      id: id.value,
      body,
      optimisticRecipe
    })
    await pushToRoot.execute(id.value)
    await using _ = await toaster.apiSucceeded('Recipe updated!')
  } catch (e) {
    await using _ = await toaster.apiError(e)
  } finally {
    loading.value = false
  }
}

const modalController = useModal()
const deleteRecipe = async () => {
  try {
    await using resp = await modalController.create({
      title: 'Delete Recipe',
      body: 'Are you sure you want to delete this recipe?'
    }).show()
    if (!('id' in updateRecipe.value) || !resp.ok) return
    loading.value = true
    await recipeMutations.remove.mutateAsync({ id: updateRecipe.value.id })
    await router.push({
      path: '/'
    })
  } finally {
    loading.value = false
  }
}
</script>
