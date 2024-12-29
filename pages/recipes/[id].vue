<template>
  <div>
    Edit
    {{ recipe.data.value }}
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const recipe = await useFetch(`/api/recipes/${route.params.id}`)
</script>
