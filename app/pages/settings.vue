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
  get: () => settings.downloads.preferredDownloadFileType.value,
  set: settings.downloads.setFileType
})
const fileDownloadTypeOptions = Object.keys(objectToBlobSerializers).map(
  (key) => ({
    text: key.toUpperCase(),
    value: key
  })
)
const denseRecipeModal = computed({
  get: () => settings.dense.prefersDenseRecipeModal.value,
  set: settings.dense.setDenseRecipeModal
})
</script>
