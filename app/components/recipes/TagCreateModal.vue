<template>
  <BModal v-model="showAddModal" title="Add Tag">
    <div>
      <BFormInput
        v-model="text"
        v-bind="textAttrs"
        label="Tag"
        placeholder="Tag name"
        class="mb-1"
        :state="errorBag.text?.[0] ? false : null"
      />
      <BFormInvalidFeedback
        v-show="errorBag.text?.[0]"
        :state="false"
      >
        {{ errorBag.text?.[0] }}
      </BFormInvalidFeedback>
    </div>
    <BFormSelect
      v-model="variant"
      v-bind="variantAttrs"
      :state="errorBag.variant?.[0] ? false : null"
      label="Variant"
      :options="[{ text: 'Pick a Color', value: null }, ...recipeTagVariantsWeb]"
    />
    <template #footer>
      <BButton :disabled="isSubmitting" @click="showAddModal = false"
        >Cancel</BButton
      >
      <BButton variant="primary" :loading="isSubmitting" @click="onSubmit"
        >Add</BButton
      >
    </template>
  </BModal>
</template>

<script setup lang="ts">
import {
  recipeTagVariantsWeb,
  type CreateRecipeTagRequest
} from '../../../types/recipe.ts'
import {object, string, enum as zodEnum} from "zod";

const toaster = useToaster()

const showAddModal = defineModel<boolean>({
  required: true
})
const props = defineProps<{
  existingTags: CreateRecipeTagRequest[]
}>()

const {
  isSubmitting,
    errorBag,
    defineField,
    handleSubmit,
} = useForm({
  validationSchema: toTypedSchema(object({
    text: string().nonempty().refine((v) => !props.existingTags.some((tag) => tag.text === v), {
      message: 'Tag text must be unique'
    }),
    variant: zodEnum(recipeTagVariantsWeb)
  }))
})
const [text, textAttrs] = defineField('text')
const [variant, variantAttrs] = defineField('variant')

const onSubmit = handleSubmit(async (submitted) => {
  try {
    const body: CreateRecipeTagRequest = {
      ...submitted,
      variant: submitted.variant || undefined
    }
    await $fetch('/api/recipe-tags', {
      method: 'POST',
      body
    })
    await using _ = await toaster.apiSucceeded('Tag added!')
    showAddModal.value = false
  } catch (e) {
    await using _ = await toaster.apiError(e)
  }
})
</script>
