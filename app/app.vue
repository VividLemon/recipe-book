<template>
  <BApp>
    <NuxtPwaManifest />
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
          <BNavbarBrand>{{ appConfig.siteName }}</BNavbarBrand>
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
              {{ appConfig.siteName }}
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
                  :disabled="item.disabled"
                  :aria-disabled="item.disabled"
              >
                {{ item.title }}
              </BListGroupItem>
            </BListGroup>
          </BOffcanvas>
        </BCol>
        <BCol style="overflow-y: auto; height: 100vh" class="me-0 pe-0">
          <BRow class="px-3 pt-2">
            <BCol><AccountMenu /></BCol>
          </BRow>
          <BRow v-if="offline" class="px-3 pt-2">
            <BCol>
              <BAlert :model-value="true" variant="warning" class="mb-0">
                You're offline. Showing saved recipes; creating and editing are unavailable.
              </BAlert>
            </BCol>
          </BRow>
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
const appConfig = useAppConfig()
provideSystemSettings()
configureVeeValidate()

const offcanvas = ref(false)
const { loggedIn } = useUserSession()
const offline = useOffline()

const items = computed(() => [
  { title: 'Home', to: '/', disabled: false },
  ...(loggedIn.value ? [{ title: 'Create Recipe', to: '/recipes/create', disabled: offline.value }] : []),
  { title: 'Settings', to: '/settings', disabled: false }
])
</script>
