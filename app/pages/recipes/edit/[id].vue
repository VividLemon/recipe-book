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

const route = useRoute()
const id = computed(() => route.params.id as string)

const router = useRouter()
const toaster = useToaster()
const previousRecipe = await useFetch(`/api/recipes/${id.value}`)

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
  steps: previousRecipe.data.value?.steps || '',
  tags: previousRecipe.data.value?.tags.map((el) => el.id) || [],
  time: previousRecipe.data.value?.time.toString() || null,
  raw: previousRecipe.data.value
})

const v$ = useVuelidate()

const loading = ref(false)
const pushToRoot = usePushToRootWithOpenRecipe()
const save = async () => {
  try {
    if (
      !(await v$.value.$validate()) ||
      !updateRecipe.value.difficulty ||
      !updateRecipe.value.time
    )
      return

    loading.value = true

    const { coverImage, ...rest } = updateRecipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { coverImage }
    })

    await $fetch(`/api/recipes/${id.value}`, {
      method: 'PUT',
      body
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
    await $fetch(`/api/recipes/${updateRecipe.value.id}`, {
      method: 'DELETE'
    })
    await router.push({
      path: '/'
    })
  } finally {
    loading.value = false
  }
}
</script>
