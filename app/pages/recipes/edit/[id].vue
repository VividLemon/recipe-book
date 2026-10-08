<template>
  <RecipesCreateUpdate
    v-model="updateRecipe"
    :loading
    @delete="deleteRecipe"
    @save="save"
  />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' })

import { buildOptimisticRecipe } from '~/queries/recipeCache'
import type { UpdateRecipeModel } from '../../../components/recipes/CreateUpdate.vue'

const route = useRoute()
const id = computed(() => route.params.id as string)

const router = useRouter()
const toaster = useToaster()
const previousRecipe = await useFetch(`/api/recipes/${id.value}`)
const recipeTags = await useFetch('/api/recipe-tags')
const { update, remove } = useRecipeMutations()

if (!previousRecipe.data.value) {
  await router.push('/')
  toaster.error('Recipe not found')
}

const updateRecipe = ref<UpdateRecipeModel>({
  difficulty: previousRecipe.data.value?.difficulty || null,
  ingredients: previousRecipe.data.value?.ingredients || [],
  id: id.value || '',
  name: previousRecipe.data.value?.name || '',
  coverImage: null,
  isPublic: previousRecipe.data.value?.isPublic !== false,
  steps: previousRecipe.data.value?.steps || '',
  tags: previousRecipe.data.value?.tags.map((el) => el.id) || [],
  time: previousRecipe.data.value?.time.toString() || null,
  raw: previousRecipe.data.value ?? null
})

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
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

    await update.mutateAsync({
      id: id.value,
      body,
      optimistic: buildOptimisticRecipe(
        { ...rest, difficulty: rest.difficulty!, time: Number.parseInt(rest.time || '') },
        recipeTags.data.value ?? [],
        previousRecipe.data.value ?? { id: id.value }
      )
    })

    await pushToRoot.execute(id.value)
    await using _ = await toaster.apiSucceeded('Recipe created!')
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
    await remove.mutateAsync({ id: updateRecipe.value.id })
    await router.push({
      path: '/'
    })
  } finally {
    loading.value = false
  }
}
</script>
