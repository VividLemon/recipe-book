<template>
  <BContainer fluid class="p-0 mx-0">
    <BRow no-gutters>
      <BCol
        tag="aside"
        md="2"
        cols="12"
        class="border-end p-0"
        :style="!nav?.showNav ? 'height: 100vh; width: 250px' : undefined"
      >
        <AppNavbar ref="navbar" />
      </BCol>
      <BCol tag="main" class="p-0">
        <BContainer fluid>
          <BRow no-gutters>
            <BCol>
              <NuxtPage />
            </BCol>
          </BRow>
        </BContainer>
      </BCol>
    </BRow>
  </BContainer>
  <BToastOrchestrator />
</template>

<script setup lang="ts">
import { useColorMode } from 'bootstrap-vue-next/composables/useColorMode'
import AppNavbar from './components/AppNavbar.vue'

useColorMode()

const nav = useTemplateRef('navbar')
</script>
