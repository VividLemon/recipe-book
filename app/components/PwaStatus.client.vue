<template>
  <BToast
    :model-value="updateAvailable"
    title="Update available"
    variant="info"
    no-auto-hide
    @hidden="dismissUpdate"
  >
    A newer version of Recipe Book is ready.
    <template #footer>
      <BButton size="sm" variant="primary" @click="applyUpdate">Update now</BButton>
      <BButton class="ms-2" size="sm" variant="outline-secondary" @click="dismissUpdate">Later</BButton>
    </template>
  </BToast>
</template>

<script setup lang="ts">
const { applyUpdate, canInstall, dismissUpdate, install, updateAvailable } = usePwa()

watch(canInstall, (available) => {
  window.dispatchEvent(new CustomEvent('recipe-book:pwa-install-available', { detail: available }))
}, { immediate: true })

onMounted(() => window.addEventListener('recipe-book:pwa-install', install))
onUnmounted(() => window.removeEventListener('recipe-book:pwa-install', install))
</script>
