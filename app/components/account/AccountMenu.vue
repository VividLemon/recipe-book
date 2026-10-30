<template>
  <div class="d-flex justify-content-end">
    <BButton
      v-if="!loggedIn"
      to="/login"
      variant="outline-secondary"
      aria-label="Log in"
    >
      <PersonCircleIcon />
    </BButton>
    <BDropdown v-else variant="outline-secondary" menu-class="dropdown-menu-end">
      <template #button-content>
        <PersonCircleIcon />
        <span class="ms-2">{{ user?.username }}</span>
      </template>
      <BDropdownItem to="/profile">My profile</BDropdownItem>
      <BDropdownDivider />
      <BDropdownItem @click="logout">Logout</BDropdownItem>
    </BDropdown>
  </div>
</template>

<script setup lang="ts">
import { useQueryCache } from '@pinia/colada'
import PersonCircleIcon from '~icons/bi/person-circle'
import { recipeKeys } from '~/queries/recipes'

const { loggedIn, user, clear } = useUserSession()
const queryCache = useQueryCache()
const { $offlineData } = useNuxtApp()

const flushCaches = () => {
  for (const entry of queryCache.getEntries({ key: recipeKeys.root })) {
    queryCache.remove(entry)
  }
}

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  // Order matters: once the session is cleared no new device write can be made
  // for this user, so the wipe that follows is final. The wipe also stops a
  // running sync before it writes again.
  await clear()
  flushCaches()
  await $offlineData.wipe()
  await navigateTo('/login')
}
</script>
