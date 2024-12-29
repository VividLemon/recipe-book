<template>
  <BContainer fluid="md" class="p-0 ms-0">
    <BRow>
      <BCol
        md="3"
        cols="12"
        class="border-end p-0 your-element-class"
        :style="nav?.showNav ? 'height: 100vh' : undefined"
      >
        <AppNavbar ref="navbar" />
      </BCol>
      <BCol>
        <NuxtPage />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { useColorMode } from 'bootstrap-vue-next/composables/useColorMode'
import AppNavbar from './components/AppNavbar.vue'

useColorMode()

const nav = useTemplateRef('navbar')
</script>

<style scoped>
.your-element-class {
  height: 100vh;
}

@media (max-width: 768px) {
  .your-element-class {
    height: 100%;
  }
}
</style>
