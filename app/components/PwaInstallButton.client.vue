<template>
  <BButton v-if="canInstall" variant="primary" @click="install">Install Recipe Book</BButton>
</template>

<script setup lang="ts">
const { canInstall, install } = usePwa()
</script>
