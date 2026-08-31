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
        v-bind="fileAttrs"
      />
      <BFormInvalidFeedback
        v-show="errorBag.file?.[0]"
        :state="false"
      >
        {{ errorBag.file?.[0] }}
      </BFormInvalidFeedback>
    </div>

    <div>
      <label class="me-2">Preserve aspect ratio</label>
      <BFormCheckbox v-model="preserveAspectRatio" v-bind="preserveAspectRatioAttrs" inline />
    </div>
    <template #footer>
      <BButton variant="warning" :disabled="loading || isSubmitting" @click="open = false">
        Cancel
      </BButton>
      <BButton variant="primary" :loading="loading || isSubmitting" @click="onSubmit">
        Ok
      </BButton>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import {useForm} from 'vee-validate'
import {boolean, object} from "zod";

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

const fileValidation = usePhotoFileValidation()
const {
  handleReset: reset,
  defineField,
  handleSubmit,
  errorBag,
  isSubmitting
} = useForm({
  validationSchema: computed(() => toTypedSchema(object(({
    file: fileValidation(),
    preserveAspectRatio: boolean()
  }))))
})

const [file, fileAttrs] = defineField('file')
const [preserveAspectRatio, preserveAspectRatioAttrs] = defineField('preserveAspectRatio')

const onSubmit = handleSubmit((submitted) => {
  const formData = objToFormData({
    files: {
      file: submitted.file
    }
  })
  emit('add-image', {
    data: formData,
    preserveAspectRatio: submitted.preserveAspectRatio
  })
})
</script>
