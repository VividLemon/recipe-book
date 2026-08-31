<template>
  <BApp>
    <BContainer fluid class="m-0 p-0">
      <BRow class="d-md-none">
        <BNavbar>
          <BButton
              :variant="null"
              aria-label="Toggle Menu"
              @click="offcanvas = !offcanvas"
          >
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
          <BOffcanvas
              v-model="offcanvas"
              body-class="p-0"
              placement="start"
              responsive="md"
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
        </BCol>
        <BCol style="overflow-y: auto; height: 100vh" class="me-0 pe-0">
          <NuxtPage />
        </BCol>
      </BRow>
    </BContainer>
  </BApp>
</template>

<script setup lang="ts">
import MenuIcon from '~icons/bi/list'
import {configureVeeValidate} from "~/utils/configureVeeValidate.ts";

useColorMode()
const runtimeConfig = useRuntimeConfig()
provideSystemSettings()
configureVeeValidate()

const offcanvas = ref(false)

const items = [
  { title: 'Home', to: '/' },
  { title: 'Create Recipe', to: '/recipes/create' },
  { title: 'Settings', to: '/settings' }
] as const
</script>
