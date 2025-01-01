<template>
  <BModal :model-value="open" @hide="emit('change', null)">
    <BFormFile
      v-model="file"
      label="Upload Image"
      :state="validateStateError(v$.file)"
      @blur="v$.file.$touch"
      @update:model-value="v$.file.$touch"
    />
    <BFormInvalidFeedback
      v-show="v$.file.$dirty"
      :state="validateStateError(v$.file)"
    >
      {{ v$.file.$errors[0]?.$message }}
    </BFormInvalidFeedback>
    <template #footer>
      <BButton
        variant="warning"
        :disabled="isUploading"
        @click="emit('change', null)"
        >Cancel</BButton
      >
      <BButton variant="primary" :loading="isUploading" @click="onOk"
        >Ok</BButton
      >
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import type { CreatePhotoRequest } from '~/types/photo'
import type { Photo } from '~/types/recipe'

const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  change: [url: Photo | null]
}>()

const toaster = useToastController()

const isUploading = ref(false)

const file = ref<File | null>(null)
const fileValidation = usePhotoFileValidation()

const v$ = useVuelidate(
  computed(() => ({
    file: fileValidation.value
  })),
  { file },
  { $stopPropagation: true }
)
watch(
  () => props.open,
  () => {
    file.value = null
    v$.value.$reset()
  }
)

const onOk = async () => {
  try {
    isUploading.value = true
    if (!(await v$.value.$validate()) || !file.value) return
    const formData = objToFormData({
      files: {
        file: file.value
      }
    })

    const data = await $fetch('/api/photos', {
      method: 'POST',
      body: formData
    })
    emit('change', data.url)
  } catch (e: unknown) {
    toaster.show?.({
      props: {
        title: 'Error',
        body: errorToString(e),
        variant: 'danger'
      }
    })
  } finally {
    isUploading.value = false
  }
}
</script>
