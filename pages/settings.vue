<template>
  <div>
    <BFormGroup label="File Download Type" for="file-download-type-setting">
      <BFormSelect
        v-model="fileDownloadType"
        :options="fileDownloadTypeOptions"
      />
    </BFormGroup>
    <BFormCheckbox v-model="denseRecipeModal">
      Dense Recipe Modal
    </BFormCheckbox>
  </div>
</template>

<script setup lang="ts">
const settings = useSystemSettings()

const fileDownloadType = computed({
  get: () => settings.localDownloadFileType.value,
  set: (v) => {
    settings.setLocalDownloadFileType(v)
  }
})
const fileDownloadTypeOptions = Object.keys(objectToBlobSerializers).map(
  (key) => ({
    text: key.toUpperCase(),
    value: key
  })
)
const denseRecipeModal = computed({
  get: () => settings.denseRecipeModal.value,
  set: (v) => {
    settings.setDenseRecipeModal(v)
  }
})
</script>
