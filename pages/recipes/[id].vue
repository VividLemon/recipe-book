<template>
  <div>
    Show
    {{ recipe.data.value }}
    <div v-html="recipe.data.value?.steps" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const recipe = await useFetch(`/api/recipes/${route.params.id}`)
</script>
