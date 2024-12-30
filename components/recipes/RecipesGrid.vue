<template>
  <BCardGroup>
    <BCard v-for="recipe in recipes" :key="recipe.id">
      {{ recipe.name }}
    </BCard>
  </BCardGroup>
</template>

<script setup lang="ts">
import type { Recipe } from '~/types/recipe'

defineProps<{
  recipes: Recipe[]
}>()
</script>
