<template>
  <BModal v-model="showAddModal" title="Add Tag">
    <div>
      <BFormInput
        v-model="newTag.text"
        label="Tag"
        placeholder="Tag name"
        class="mb-1"
        :state="validateStateError(v$.newTag.text)"
        @update:model-value="v$.newTag.text.$touch"
        @blur="v$.newTag.text.$touch"
      />
      <BFormInvalidFeedback
        v-show="v$.newTag.text.$dirty"
        :state="validateStateError(v$.newTag.text)"
      >
        {{ v$.newTag.text.$errors[0]?.$message }}
      </BFormInvalidFeedback>
    </div>
    <BFormSelect
      v-model="newTag.variant"
      label="Variant"
      :options="[{ text: 'Pick a Color', value: null }, ...recipeTagVariants]"
    />
    <template #footer>
      <BButton :disabled="isUploading" @click="showAddModal = false"
        >Cancel</BButton
      >
      <BButton variant="primary" :loading="isUploading" @click="addTag"
        >Add</BButton
      >
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { helpers, required } from '@vuelidate/validators'
import {
  recipeTagVariants,
  type CreateRecipeTagRequest
} from '../../types/recipe'

const toaster = useToaster()

const showAddModal = defineModel<boolean>({
  required: true
})
const props = defineProps<{
  existingTags: CreateRecipeTagRequest[]
}>()

const createNewTag = (): Omit<CreateRecipeTagRequest, 'variant'> & {
  variant: Exclude<CreateRecipeTagRequest['variant'], undefined> | null
} => ({
  text: '',
  variant: null
})

const newTag = ref(createNewTag())
watch(showAddModal, () => {
  newTag.value = createNewTag()
})
const v$ = useVuelidate(
  {
    newTag: {
      text: {
        required,
        isUnique: helpers.withMessage(
          'Tag text must be unique',
          (v: unknown) => {
            if (!helpers.req(v)) return true
            return !props.existingTags.some((tag) => tag.text === v)
          }
        )
      }
    }
  },
  { newTag },
  { $stopPropagation: true }
)
const isUploading = ref(false)
const addTag = async () => {
  try {
    if (!(await v$.value.$validate())) return
    isUploading.value = true
    const body: CreateRecipeTagRequest = {
      ...newTag.value,
      variant: newTag.value.variant || undefined
    }
    await $fetch('/api/recipe-tags', {
      method: 'POST',
      body
    })
    toaster.apiSucceeded('Tag added!')
    showAddModal.value = false
  } catch (e) {
    toaster.apiError(e)
  } finally {
    isUploading.value = false
  }
}
</script>
