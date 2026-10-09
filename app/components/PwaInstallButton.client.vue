<template>
  <BButton v-if="canInstall" variant="primary" @click="install">Install Recipe Book</BButton>
</template>

<script setup lang="ts">
const canInstall = ref(false)
const install = () => window.dispatchEvent(new Event('recipe-book:pwa-install'))
const updateAvailability = (event: Event) => {
  canInstall.value = (event as CustomEvent<boolean>).detail
}

onMounted(() => window.addEventListener('recipe-book:pwa-install-available', updateAvailability))
onUnmounted(() => window.removeEventListener('recipe-book:pwa-install-available', updateAvailability))
</script>
