<template>
  <RecipesCreateUpdate v-model="updateRecipe" @save="save" />
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
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
  photo: null,
  steps: previousRecipe.data.value?.steps || '',
  tags: previousRecipe.data.value?.tags.map((el) => el.id) || [],
  time: previousRecipe.data.value?.time.toString() || null
})

const v$ = useVuelidate()

const save = async () => {
  try {
    if (
      !(await v$.value.$validate()) ||
      !updateRecipe.value.difficulty ||
      !updateRecipe.value.time
    )
      return

    const { photo, ...rest } = updateRecipe.value
    const body = objToFormData({
      body: {
        ...rest,
        time: Number.parseInt(rest.time || '')
      },
      files: { photo }
    })

    await $fetch(`/api/recipes/${id.value}`, {
      method: 'PUT',
      body
    })

    await router.push(`/recipes/${id.value}`)
    toaster.apiSucceeded('Recipe created!')
  } catch (e) {
    toaster.apiError(e)
  }
}
</script>
