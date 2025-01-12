<template>
  <BModal :model-value="open" @hide="open = false" @hidden="reset">
    <BAlert v-if="dimensionsResizeWarning" :model-value="true">
      Warning: image dimensions exceeding width:
      {{ dimensionsResizeWarning?.width }}px and height:
      {{ dimensionsResizeWarning?.height }}px will be resized
    </BAlert>

    <div>
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
    </div>

    <div>
      <label class="me-2">Preserve aspect ratio</label>
      <BFormCheckbox v-model="preseveAspectRatio" inline />
    </div>
    <template #footer>
      <BButton variant="warning" :disabled="loading" @click="open = false"
        >Cancel</BButton
      >
      <BButton variant="primary" :loading="loading" @click="onOk">Ok</BButton>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'

withDefaults(
  defineProps<{
    loading: boolean
    dimensionsResizeWarning?: { height: number; width: number } | null
  }>(),
  { dimensionsResizeWarning: null }
)

const open = defineModel<boolean>({
  required: true
})
const emit = defineEmits<{
  'add-image': [data: { data: FormData; preserveAspectRatio: boolean }]
}>()

// When you add a new value here, add it to the `reset` function
const preseveAspectRatio = ref(true)
const file = ref<File | null>(null)

const fileValidation = usePhotoFileValidation()

const v$ = useVuelidate(
  computed(() => ({
    file: fileValidation.value
  })),
  { file },
  { $stopPropagation: true }
)

const reset = () => {
  file.value = null
  preseveAspectRatio.value = true
  v$.value.$reset()
}

const onOk = async () => {
  if (!(await v$.value.$validate()) || !file.value) return
  const formData = objToFormData({
    files: {
      file: file.value
    }
  })

  emit('add-image', {
    data: formData,
    preserveAspectRatio: preseveAspectRatio.value
  })
}
</script>
