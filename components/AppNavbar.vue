<template>
  <BNavbar v-show="showNav">
    <BButton :variant="null" @click="offcanvas = !offcanvas">
      <MenuIcon style="font-size: 1.3em" />
    </BButton>
    <BNavbarBrand>{{ runtimeConfig.public.siteName }}</BNavbarBrand>
  </BNavbar>
  <ClientOnly>
    <BOffcanvas
      ref="offcanvasState"
      v-model="offcanvas"
      body-class="p-0"
      placement="start"
      :responsive
    >
      <template #title>
        {{ runtimeConfig.public.siteName }}
      </template>
      <BListGroup class="w-100 rounded-0 border-start-0 border-end-0">
        <BListGroupItem class="border-start-0 border-end-0" to="/"
          >Home</BListGroupItem
        >
        <BListGroupItem class="border-start-0 border-end-0" to="/recipes/create"
          >Create Recipe</BListGroupItem
        >
        <BListGroupItem class="border-start-0 border-end-0" to="/settings">
          Settings
        </BListGroupItem>
      </BListGroup>
    </BOffcanvas>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { BOffcanvas } from 'bootstrap-vue-next'
import MenuIcon from '~icons/bi/list'

const responsive = 'md'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const offcanvasState = ref<null | InstanceType<typeof BOffcanvas>>(null)

watch(
  () => route.fullPath,
  () => {
    offcanvas.value = false
  }
)

const offcanvas = ref(false)
const showNav = computed(
  () => offcanvasState.value?.isOpenByBreakpoint === false
)

defineExpose({
  showNav
})
</script>
