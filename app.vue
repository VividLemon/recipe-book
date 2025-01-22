<template>
  <BContainer fluid class="m-0 p-0">
    <BToastOrchestrator />
    <BRow class="d-md-none">
      <BNavbar>
        <BButton :variant="null" @click="offcanvas = !offcanvas">
          <MenuIcon style="font-size: 1.3em" />
        </BButton>
        <BNavbarBrand>{{ runtimeConfig.public.siteName }}</BNavbarBrand>
      </BNavbar>
    </BRow>
    <BRow no-gutters>
      <BCol
        cols="3"
        xl="2"
        tag="aside"
        class="bd-sidebar border-start border pe-0"
      >
        <ClientOnly>
          <BOffcanvas
            v-model="offcanvas"
            body-class="p-0"
            placement="start"
            :responsive
          >
            <template #title>
              {{ runtimeConfig.public.siteName }}
            </template>
            <BListGroup
              tag="nav"
              class="w-100 rounded-0 border-start-0 border-end-0"
            >
              <BListGroupItem
                v-for="item in items"
                :key="item.title"
                class="border-start-0 border-end-0"
                :to="item.to"
              >
                {{ item.title }}
              </BListGroupItem>
            </BListGroup>
          </BOffcanvas>
        </ClientOnly>
      </BCol>
      <BCol style="overflow-y: auto; height: 100vh" class="me-0 pe-0">
        <NuxtPage />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { useColorMode } from 'bootstrap-vue-next/composables/useColorMode'
import MenuIcon from '~icons/bi/list'

const responsive = 'md'

useColorMode()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const offcanvas = ref(false)

watch(
  () => route.fullPath,
  () => {
    offcanvas.value = false
  }
)

const items = [
  { title: 'Home', to: '/' },
  { title: 'Create Recipe', to: '/recipes/create' },
  { title: 'Settings', to: '/settings' }
] as const
</script>

<style scoped>
.bd-sidebar {
  position: sticky;
  display: block !important;
  height: 100vh;
  overflow-y: auto;
}

@media (max-width: 767.98px) {
  /* For screens smaller than the 'md' breakpoint */
  .bd-sidebar {
    position: static; /* Override sticky behavior */
    overflow-y: visible; /* Remove scrolling for smaller screens */
    width: 0;
    height: 0px;
  }
}
</style>
