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
import PersonCircleIcon from '~icons/bi/person-circle'

const { loggedIn, user, clear } = useUserSession()

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>
