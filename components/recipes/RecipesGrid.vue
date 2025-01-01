<template>
  <BCardGroup>
    <BCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :title="recipe.name"
      :img-src="recipe.photo?.thumbnail"
      img-width="200px"
    >
      {{ recipe.name }}
      <BLink :to="`/recipes/${recipe.id}`">Edit</BLink>
    </BCard>
  </BCardGroup>
</template>

<script setup lang="ts">
import type { Recipe } from '~/types/recipe'

defineProps<{
  recipes: Recipe[]
}>()
</script>
