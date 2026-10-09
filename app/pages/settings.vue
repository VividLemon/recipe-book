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
    <div class="mt-3">
      <BButton v-if="canInstall" variant="primary" @click="install">
        Install Recipe Book
      </BButton>
      <BButton v-if="updateAvailable" class="ms-2" variant="warning" @click="applyUpdate">
        Apply update
      </BButton>
      <BButton v-if="updateAvailable" class="ms-2" variant="link" @click="dismissUpdate">
        Dismiss
      </BButton>
    </div>
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

const { isPWAInstalled, canInstall, install, applyUpdate, dismissUpdate, updateAvailable } = usePwa()
const toaster = useToaster()
watch(updateAvailable, (available) => {
  if (available) void toaster.apiSucceeded('An update is available.')
})
</script>
