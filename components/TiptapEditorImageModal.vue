<template>
  <BModal :model-value="open" @hide="emit('change', null)">
    <BFormFile
      v-model="image"
      label="Upload Image"
      :state="validateStateError(v$.image)"
      @blur="v$.image.$touch"
      @update:model-value="v$.image.$touch"
    />
    <BFormInvalidFeedback
      v-if="v$.image.$dirty"
      :state="validateStateError(v$.image)"
      >{{
        v$.image.$errors.map((el) => el.$message.toString())[0]
      }}</BFormInvalidFeedback
    >
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
import { required, helpers } from '@vuelidate/validators'

const runtimeConfig = useRuntimeConfig()

const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  change: [url: string | null]
}>()

const toaster = useToastController()

const image = ref<File | null>(null)

const v$ = useVuelidate(
  {
    image: {
      required,
      isObject: helpers.withMessage(
        'Unknown type, expected object',
        (v: unknown) => {
          if (!helpers.req(v)) return true
          return v instanceof File
        }
      ),
      acceptedType: helpers.withMessage(
        `Invalid file type. Acceptable types are: ${runtimeConfig.public.picture.acceptedImageTypes.join(', ')}`,
        (v: unknown) => {
          if (!helpers.req(v)) return true
          const file = v as File
          const included =
            runtimeConfig.public.picture.acceptedImageTypes.includes(file.type)
          return included
        }
      )
    }
  },
  { image },
  { $stopPropagation: true }
)
watch(
  () => props.open,
  () => {
    image.value = null
    v$.value.$reset()
  }
)

const isUploading = ref(false)
const uploadImage = async () => {
  isUploading.value = true
  try {
    if (!image.value) throw new Error('No image selected')
    const formData = new FormData()
    formData.append('photo', image.value)
    const data = await $fetch('/api/photo', {
      method: 'POST',
      body: formData
    })
    return data.url.default
  } finally {
    isUploading.value = false
  }
}
const onOk = async () => {
  try {
    if (!(await v$.value.$validate())) return
    const imgUrl = await uploadImage()
    emit('change', imgUrl)
  } catch (e: unknown) {
    toaster.show?.({
      props: {
        title: 'Error',
        body: errorToString(e),
        variant: 'danger'
      }
    })
  }
}
</script>
